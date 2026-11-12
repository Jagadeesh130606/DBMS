# Multi-Model Database Architecture & Polyglot Persistence Design

## 1. Executive Summary & Architectural Overview

The **Research Paper Discovery and Semantic Recommendation System** employs a **Multi-Model Polyglot Persistence Architecture** combining two primary database engines:
1. **PostgreSQL 16 (Relational Database with pgvector extension):** Serves as the authoritative source of truth for strongly structured, relational, transactional, and dense vector data across **12 normalized tables**.
2. **MongoDB 8.2 (Document-Oriented Database):** Houses hierarchical, semi-structured, and analytical research paper contents across **4 specialized collections**.

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
         |    (12 Relational Tables)     |                         |    (4 Document Collections)   |
         +---------------+---------------+                         +---------------+---------------+
                         |                                                         |
         +---------------+---------------+                         +---------------+---------------+
         | - USERS (Auth & Roles)        |                         | - paper_documents (110 Docs)  |
         | - AUTHORS & RESEARCH_AREA     |                         |   (full_text, sections, refs) |
         | - JOURNAL (PUBLISHED_IN)      |                         | - author_documents (35 Docs)  |
         | - CONFERENCE (PRESENTED_IN)   |                         |   (bios, h-index, profiles)   |
         | - RESEARCH_PAPER (110 Papers) |                         | - research_area_documents     |
         | - PAPER_AUTHOR & PAPER_AREA   |                         |   (taxonomy, sub-topics)      |
         | - CITATION (195 Edges)        |                         | - citation_documents (110)    |
         | - BOOKMARK & SEARCH_HISTORY   |                         |   (context sentences, graph)  |
         | - GIN Index (Full-Text Search)|                         | - Aggregation Pipelines       |
         +---------------+---------------+                         +---------------+---------------+
                         |
                         v
         +-------------------------------+
         |       pgvector Extension      |
         |  - PAPER_EMBEDDINGS Table     |
         |  - 384-D SentenceTransformer  |
         |  - Cosine Distance (<=>)      |
         |  - HNSW ANN Index             |
         +-------------------------------+
```

---

## 2. Division of Responsibilities across the 4 MongoDB Collections

| MongoDB Collection | Linking Key | Stored Content & Structure | Primary Use Cases |
| :--- | :--- | :--- | :--- |
| **`paper_documents`** | `paper_id` | `full_text`, `sections` array (Intro, Methodology, Results, Conclusion), `references` array, `keywords`, `metadata` | Detailed article viewing, text aggregation, keyword frequency distribution |
| **`author_documents`** | `author_id` | `bio`, `research_interests` array, `co_author_ids` array, `metrics` (`h_index`, `total_citations`), `external_profiles` | Researcher portfolios, academic impact metrics, co-author graph exploration |
| **`research_area_documents`**| `area_id` | `area_name`, `overview`, `sub_topics` array, `emerging_trends` array, `top_venues` array, `recommended_paper_ids` | Domain taxonomy navigation, trending research topic discovery |
| **`citation_documents`** | `paper_id` | `incoming_citation_count`, `outgoing_citation_count`, `citing_papers` with context sentences, `cited_papers`, influence metrics | Bibliographic context display, graph metrics without expensive multi-hop SQL joins |

---

## 3. Two-Phase Cross-Database Synchronization (Saga Pattern)

### 3.1 Addition Workflow (`POST /api/papers`)
```
[Client / API Request]
         |
         v
+-------------------------------------------------------------+
| Step 1: PostgreSQL Atomic Transaction (BEGIN)               |
| - Insert into RESEARCH_PAPER                                |
| - Insert into PAPER_AUTHOR (M:N)                            |
| - Insert into PAPER_AREA (M:N)                              |
| - Generate & insert 384-D vector into PAPER_EMBEDDINGS      |
| - COMMIT PostgreSQL Transaction                             |
+-------------------------------------------------------------+
         |
         |---> SUCCESS: Proceed to MongoDB writes
         |---> FAILURE: ROLLBACK PostgreSQL; Abort immediately
         v
+-------------------------------------------------------------+
| Step 2: Write Documents to MongoDB Collections              |
| - Upsert into paper_documents                               |
| - Upsert into citation_documents                            |
+-------------------------------------------------------------+
         |
         |---> SUCCESS: Return 201 Created to Client
         |---> FAILURE: Execute PostgreSQL Compensation:
         |              DELETE FROM RESEARCH_PAPER WHERE paper_id = X;
         |              Delete partial MongoDB documents;
         |              Return 500 Error with Compensation Audit Log
```

### 3.2 Update Workflow (`PUT /api/papers/[id]`)
1. Updates `RESEARCH_PAPER` metadata (title, abstract, DOI, source, source_type, journal_id, conference_id).
2. Updates `PAPER_AUTHOR` sequence and `PAPER_AREA` categorization.
3. Recomputes 384-D dense embedding and updates `PAPER_EMBEDDINGS`.
4. Updates MongoDB `paper_documents` (`full_text`, `sections`, `references`, `keywords`, `metadata`).

### 3.3 Deletion Workflow (`DELETE /api/papers/[id]`)
1. Executes `DELETE FROM RESEARCH_PAPER WHERE paper_id = $1`.
2. PostgreSQL foreign key constraints with `ON DELETE CASCADE` automatically purge records in `PAPER_AUTHOR`, `PAPER_AREA`, `CITATION`, `BOOKMARK`, and `PAPER_EMBEDDINGS`.
3. Deletes document from MongoDB `paper_documents` and `citation_documents`.

---

## 4. Search Architectures & Hybrid Reciprocal Rank Fusion (RRF)

$$RRF\_Score(d) = \sum_{m \in \{\text{FTS}, \text{Vector}\}} \frac{1}{60 + r_m(d)}$$

- **Lexical Search (FTS):** PostgreSQL `to_tsvector('english', title || ' ' || abstract) @@ plainto_tsquery('english', $1)` with GIN index.
- **Dense Vector Search:** pgvector `embedding <=> $1::vector` with HNSW index and 384-D cosine distance calculation.
- **Hybrid Fusion:** RRF merges ordinal ranks from both search engines, eliminating raw score scale distortion.
