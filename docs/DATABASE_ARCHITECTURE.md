# Multi-Model Database Architecture & Polyglot Persistence Design

## 1. Executive Summary & Architectural Overview

The **Research Paper Discovery and Semantic Recommendation System** employs a **Multi-Model Polyglot Persistence Architecture** combining two primary database engines:
1. **PostgreSQL 16 (Relational Database with pgvector extension):** Serves as the authoritative source of truth for strongly structured, relational, transactional, and dense vector data.
2. **MongoDB 8.2 (Document-Oriented Database):** Houses hierarchical, semi-structured, and flexible research paper contents including multi-level sections, bibliographies, references arrays, and analytical metadata.

```
                                  +---------------------------------------+
                                  |       Next.js Full-Stack App          |
                                  |    (TypeScript / App Router API)      |
                                  +-------------------+-------------------+
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |     PostgreSQL 16 Engine      |                         |       MongoDB 8.2 Engine      |
         |       (Relational Data)       |                         |        (Document Store)       |
         +---------------+---------------+                         +---------------+---------------+
                         |                                                         |
         +---------------+---------------+                                         |
         | - USERS (Auth & Roles)        |                                         |
         | - AUTHORS & RESEARCH_AREA     |                                         |
         | - RESEARCH_PAPER (Metadata)   |                                         |
         | - PAPER_AUTHOR & PAPER_AREA   |                                         |
         | - CITATION (Graph Relations)  |                                         |
         | - BOOKMARK & SEARCH_HISTORY   |                                         |
         | - GIN Index (Full-Text Search)|                                         |
         +---------------+---------------+                                         |
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |       pgvector Extension      |                         |   paper_documents Collection  |
         |  - PAPER_EMBEDDINGS Table     |                         |   - full_text                 |
         |  - 384-D SentenceTransformer  |                         |   - sections (Hierarchical)   |
         |  - Cosine Distance (<=>)      |                         |   - references (Array)        |
         |  - HNSW Indexing              |                         |   - Aggregation Pipelines     |
         +-------------------------------+                         +-------------------------------+
```

---

## 2. Rationale for Multi-Model Storage

A traditional monolithic database architecture fails to address the divergent access patterns and data shapes inherent in an academic discovery platform:

| Requirement / Dimension | PostgreSQL + pgvector | MongoDB Document Store | Architectural Decision |
| :--- | :--- | :--- | :--- |
| **Referential Integrity & ACID** | High; strict foreign keys, composite PKs, unique DOIs, trigger-enforced constraints. | Loose; non-relational, reference by logical ID without cross-collection cascading constraints. | **PostgreSQL** enforces strict relational constraints and transaction safety. |
| **Citation Network Graphs** | Recursive Common Table Expressions (CTEs) traversing acyclic directed graphs. | Requires `$graphLookup` aggregation, which is less performant for multi-level join integrity. | **PostgreSQL** handles citation hierarchies and acyclic validation. |
| **Full-Text Lexical Search** | Native `tsvector`, `tsquery`, and GIN indexes with English stemming. | Full text indexes supported, but lacks native relational rank weighting alongside joins. | **PostgreSQL** provides high-speed indexed lexical search via `websearch_to_tsquery`. |
| **Dense Vector Similarity** | Native `vector(384)` type, cosine distance operator `<=>`, and HNSW indexing. | MongoDB Atlas Vector Search exists, but PostgreSQL colocates embeddings directly with relational entities. | **PostgreSQL pgvector** provides seamless relational filtering + vector search in one query. |
| **Deep Hierarchical Content** | Requires complex relational normalization (separate tables for sections, paragraphs, references). | Native nested JSON/BSON schema with arrays of subdocuments. | **MongoDB** effortlessly stores variable-length sections, subsections, and citation bibs. |
| **Analytical Aggregations** | Complex SQL aggregations across multiple joins. | High-performance `$facet`, `$unwind`, and pipeline aggregations over unstructured arrays. | **MongoDB** processes keyword frequency, section length metrics, and reference distributions. |

---

## 3. Data Distribution & Division of Responsibilities

### 3.1 PostgreSQL Engine
1. **Authentication & Access Control (`USERS`):**
   - Stores user identities, hashed passwords (bcrypt, cost factor 10), and role definitions (`ADMIN`, `STUDENT`).
   - Maintains transactional isolation for user accounts and session authorization.
2. **Relational Entities & Normalization:**
   - `AUTHORS`: Distinct author identity, affiliation, and email contact.
   - `RESEARCH_AREA`: Controlled taxonomy of academic disciplines.
   - `RESEARCH_PAPER`: Authoritative core metadata (DOI, title, abstract, citation count, source, date).
   - `PAPER_AUTHOR` & `PAPER_AREA`: Canonical junction tables with composite primary keys enforcing M:N relationships.
3. **Graph Structures & Recursive Traversal (`CITATION`):**
   - Directed edge table `(citing_paper_id, cited_paper_id)`.
   - Constrained by CHECK conditions (`citing_paper_id <> cited_paper_id`) and trigger validation (`trg_prevent_self_citation`).
   - Analyzed using Recursive CTEs for multi-hop influence mapping.
4. **User Engagement & Analytics (`BOOKMARK`, `SEARCH_HISTORY`):**
   - Fast transactional tracking of saved research papers and timestamped query logs.

### 3.2 pgvector Dense Vector Extension
- **Colocated Vector Store (`PAPER_EMBEDDINGS`):**
  - Stores 384-dimensional dense semantic vectors generated by the `all-MiniLM-L6-v2` Sentence Transformer model.
  - Linked to `RESEARCH_PAPER.paper_id` with `ON DELETE CASCADE`.
  - Enables cosine distance calculations directly within SQL:
    ```sql
    SELECT p.paper_id, p.title, 1 - (e.embedding <=> $1::vector) AS similarity_score
    FROM research_paper p
    JOIN paper_embeddings e ON p.paper_id = e.paper_id
    ORDER BY e.embedding <=> $1::vector ASC
    LIMIT 10;
    ```
  - Eliminates the need for an external vector database (e.g., Pinecone, Milvus), reducing operational complexity and eliminating network latency between relational queries and vector lookups.

### 3.3 MongoDB Document Engine
- **Hierarchical Document Store (`paper_documents`):**
  - Schema definition:
    ```typescript
    {
      paper_id: Number,              // Foreign key reference matching PostgreSQL paper_id
      full_text: String,             // Complete unstructured paper text
      sections: [                    // Array of hierarchical document sections
        { heading: String, content: String }
      ],
      references: [                  // Array of external bibliographic citations
        { title: String, authors: [String], year: Number, doi: String }
      ],
      keywords: [String],            // Variable-length keyword tags
      metadata: {
        language: String,
        document_type: String,
        word_count: Number,
        reading_time_minutes: Number
      }
    }
    ```
- **Aggregation Pipelines:**
  - Aggregates vocabulary frequencies, keyword co-occurrence maps, and document structural metrics across the corpus using `$unwind`, `$group`, and `$facet`.

---

## 4. Cross-Database Synchronization & Transaction Strategy

A fundamental challenge of polyglot persistence is ensuring consistency across disparate database engines that do not participate in a distributed two-phase commit (2PC) transaction manager.

### 4.1 Two-Phase Dual-Write with Compensation (Saga Pattern)

When an administrator creates a new research paper through `POST /api/papers`, the system executes an orchestrated workflow with explicit compensatory rollback:

```
[Client / API Request]
         |
         v
+-------------------------------------------------------------+
| Step 1: Open PostgreSQL Transaction (BEGIN)                |
| - Insert into RESEARCH_PAPER                                |
| - Insert into PAPER_AUTHOR (M:N)                            |
| - Insert into PAPER_AREA (M:N)                              |
| - Insert 384-D vector into PAPER_EMBEDDINGS                 |
| - COMMIT PostgreSQL Transaction                             |
+-------------------------------------------------------------+
         |
         |---> SUCCESS: Proceed to MongoDB write
         |---> FAILURE: ROLLBACK PostgreSQL; Abort immediately
         v
+-------------------------------------------------------------+
| Step 2: Write Document to MongoDB                           |
| - Insert document into paper_documents collection           |
+-------------------------------------------------------------+
         |
         |---> SUCCESS: Return 201 Created to Client
         |---> FAILURE: Execute PostgreSQL Compensation:
         |              DELETE FROM research_paper WHERE paper_id = X;
         |              Return 500 Error with Compensation Log
```

### 4.2 Deletion Cascades & Synchronization
When a paper is deleted (`DELETE /api/papers/[id]`):
1. PostgreSQL executes `DELETE FROM research_paper WHERE paper_id = $1`.
2. Foreign key constraints with `ON DELETE CASCADE` automatically eliminate records in `PAPER_AUTHOR`, `PAPER_AREA`, `CITATION`, `BOOKMARK`, and `PAPER_EMBEDDINGS`.
3. The API then issues `await PaperDocument.deleteOne({ paper_id: id })` against MongoDB.
4. If MongoDB fails to delete the document, a compensation event is logged for scheduled reconciliation.

---

## 5. Search Architectures & Hybrid Fusion

The platform implements three distinct search modalities to balance precision, recall, and semantic comprehension:

```
Search Query
     |
     +--------------------------+--------------------------+
     |                          |                          |
     v                          v                          v
[Keyword Search]        [Semantic Search]          [Hybrid Search]
  (PostgreSQL FTS)      (pgvector Cosine)        (RRF Fusion Formula)
     |                          |                          |
  tsvector & GIN        all-MiniLM-L6-v2              Executes Both
  websearch_to_tsquery  Dense 384-D Vector         In Parallel Streams
  ts_rank Ranking       <=> Cosine Distance                |
     |                          |                  Reciprocal Rank Fusion
     |                          |                  Score = Sum( 1 / (60 + Rank) )
     v                          v                          v
Exact Keyword Matches   Conceptual Relevance       Optimized Combined Top-K
```

### 5.1 Lexical Search (PostgreSQL Full-Text Search)
- Uses PostgreSQL's built-in text search engine.
- Generated tsvector: `to_tsvector('english', title || ' ' || abstract)`.
- Query parsing: `plainto_tsquery('english', $1)` or `websearch_to_tsquery('english', $1)`.
- Index: GIN (Generalized Inverted Index) on `to_tsvector('english', title || ' ' || abstract)`.
- Scored via `ts_rank(search_vector, query)`.

### 5.2 Dense Semantic Search (pgvector)
- Query text is converted to a normalized 384-dimensional floating-point vector using the `all-MiniLM-L6-v2` embedding model.
- Vector distance is computed using the Cosine Distance operator (`<=>`):
  $$\text{Cosine Similarity} = 1 - \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
- Supports multi-word conceptual queries without requiring exact keyword overlaps (e.g., "detecting zero day vulnerabilities" matches "intrusion detection in computer networks").

### 5.3 Hybrid Search with Reciprocal Rank Fusion (RRF)
To prevent the bias of raw score discrepancies between $ts\_rank$ ($[0, 1]$ non-linear scale) and cosine similarity ($[-1, 1]$), the platform uses **Reciprocal Rank Fusion (RRF)** with standard constant $k = 60$:

$$RRF\_Score(d) = \sum_{m \in \{\text{FTS}, \text{Vector}\}} \frac{1}{k + r_m(d)}$$

Where:
- $r_m(d)$ is the 1-based ordinal rank of document $d$ in the search result list of method $m$.
- If a document appears in only one list, only its single reciprocal rank term contributes to the total score.
- Documents present in both keyword and semantic top ranks receive significantly higher combined scores, yielding optimal precision and recall.

---

## 6. Indexing Strategy & Performance Tuning

### 6.1 PostgreSQL Indexes
1. **Primary & Unique Key B-Trees:**
   - `users(user_id)`, `users(email)`
   - `authors(author_id)`
   - `research_area(area_id)`, `research_area(area_name)`
   - `research_paper(paper_id)`, `research_paper(doi)`
   - Composite B-Trees on junction keys: `paper_author(paper_id, author_id)`, `paper_area(paper_id, area_id)`, `bookmark(user_id, paper_id)`, `citation(citing_paper_id, cited_paper_id)`.
2. **Foreign Key Indexing:**
   - `idx_paper_author_author` on `paper_author(author_id)` (avoids full table scans during author-based joins).
   - `idx_paper_area_area` on `paper_area(area_id)`.
   - `idx_citation_cited` on `citation(cited_paper_id)`.
   - `idx_bookmark_user` on `bookmark(user_id)`.
   - `idx_search_history_user` on `search_history(user_id)`.
3. **Full-Text GIN Index:**
   - `idx_paper_fts` on `to_tsvector('english', title || ' ' || abstract)`.
4. **pgvector Approximate Nearest Neighbor (ANN) Index:**
   - `idx_paper_embeddings_hnsw` on `paper_embeddings USING hnsw (embedding vector_cosine_ops)` with parameters `m = 16`, `ef_construction = 64`.

### 6.2 MongoDB Indexes
1. **Unique Relational Link:** `{ paper_id: 1 }` (unique constraint).
2. **Multikey Array Indexes:**
   - `{ keywords: 1 }` (rapid indexing of tag collections).
   - `{ "references.doi": 1 }` (fast bibliographic cross-referencing).
3. **Compound Metadata Index:**
   - `{ "metadata.document_type": 1, "metadata.language": 1 }`.
4. **Full-Text Inverted Index:**
   - `{ full_text: "text", "sections.content": "text" }`.

---

## 7. Consistency, Availability & Partitioning (CAP Theorem) Analysis

- **PostgreSQL Layer (CP / ACID):**
  - Guarantees Strict Consistency and Partition Tolerance within the relational subsystem.
  - Read Committed isolation level prevents dirty reads while maximizing transaction concurrency.
- **MongoDB Layer (AP / BASE):**
  - Optimized for High Availability and Scalable Document Writes.
  - Eventual consistency is accepted for unstructured sections and secondary analytical pipelines.
- **Overall System Profile:**
  - Relational metadata and vector search operations are strongly consistent.
  - Document viewing relies on stable paper identity linkage (`paper_id`), ensuring deterministic reads across both engines.

