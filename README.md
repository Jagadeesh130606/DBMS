# Research Paper Discovery and Semantic Recommendation System Using Multi-Model Databases

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16.0-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-0.7-teal?style=for-the-badge)](https://github.com/pgvector/pgvector)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.2-green?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A full-stack, enterprise-grade academic platform demonstrating **Multi-Model Polyglot Persistence**, **Dense Vector Semantic Search**, and **Advanced DBMS Engineering**.

Developed for academic demonstration and Level-3 DBMS evaluation, the application unites **PostgreSQL 16** (relational data, ACID transactions, GIN full-text search, and recursive CTE graph traversal), **pgvector** (384-dimensional dense vector embeddings with cosine similarity `<=>`), and **MongoDB 8.2** (semi-structured hierarchical research articles, multi-section narratives, references arrays, and multi-stage aggregation pipelines).

---

## 📑 Table of Contents
1. [Key Features & Capabilities](#key-features--capabilities)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Demo Accounts & Credentials](#demo-accounts--credentials)
5. [Quickstart & Setup](#quickstart--setup)
6. [Database Architecture & Schema](#database-architecture--schema)
7. [Advanced DBMS Implementation Checklist](#advanced-dbms-implementation-checklist)
8. [Search & Recommendation Modalities](#search--recommendation-modalities)
9. [Automated Test Suite](#automated-test-suite)
10. [Documentation Index](#documentation-index)

---

## 1. Key Features & Capabilities

- **Multi-Model Polyglot Persistence:**
  - **PostgreSQL 16:** Normalized 3NF/BCNF relational model storing users, authors, research papers, research areas, bookmarks, search histories, and directed citation graphs.
  - **MongoDB 8.2:** Unstructured document storage (`paper_documents`) for complete article bodies, hierarchical sections (Introduction, Methodology, Results, Conclusion), bibliographic references, and dynamic keywords.
  - **pgvector:** 384-dimensional dense vector embeddings generated via Sentence Transformers (`all-MiniLM-L6-v2`) for semantic similarity search using cosine distance (`<=>`).
- **Tri-Modal Search Engine:**
  - **PostgreSQL Full-Text Search:** Tokenized `tsvector` with English stemming, GIN indexing, and `ts_rank` lexical scoring.
  - **pgvector Semantic Search:** Dense vector similarity capturing conceptual semantics beyond lexical keyword matches.
  - **Hybrid Search:** Combines keyword and semantic ranking using **Reciprocal Rank Fusion (RRF)** with standard hyperparameter $k = 60$.
- **Citation Graph & Influence Mapping:**
  - Directed acyclic citation graph with SQL `CHECK` constraints and triggers preventing self-citations (`citing_paper_id <> cited_paper_id`).
  - Multi-hop recursive graph traversal using SQL **Recursive Common Table Expressions (CTEs)**.
- **Personalized Semantic Recommendations:**
  - Computes the dynamic centroid vector of a user's bookmarked research papers.
  - Queries pgvector for nearest neighbor cosine matches across unbookmarked papers.
- **Cross-Database Synchronization & Two-Phase Dual-Write:**
  - Admin paper creation triggers an atomic PostgreSQL transaction (metadata + authors + areas + 384-D embedding) followed by MongoDB document creation.
  - In the event of a secondary database failure, an explicit compensation routine rolls back PostgreSQL state to maintain cross-database parity.
- **Interactive DBMS SQL Demonstration Suite (`/dbms`):**
  - Dedicated interactive workbench executing **all 18 standard and advanced SQL query patterns**:
    1. Basic SELECT, 2. WHERE Filtering, 3. ORDER BY, 4. GROUP BY, 5. HAVING, 6. INNER JOIN, 7. LEFT JOIN, 8. RIGHT JOIN, 9. Multi-Table JOIN, 10. Aggregate Functions, 11. Subqueries, 12. Correlated Subqueries, 13. EXISTS / NOT EXISTS, 14. UNION / UNION ALL, 15. Common Table Expressions, 16. Recursive CTEs, 17. Window Functions (`RANK()`, `DENSE_RANK()`), 18. EXPLAIN ANALYZE Execution Plans.
- **MongoDB Aggregation Workbench (`/analytics`):**
  - Multi-stage pipelines demonstrating `$unwind`, `$group`, `$sort`, `$facet`, and `$project` over document keywords and section structures.
- **Role-Based Access Control (RBAC):**
  - Secure bcrypt password hashing (10 salt rounds) and signed JWT session tokens stored in secure HTTP-only cookies.
  - Student vs. Admin privileges (Admin paper CRUD, citation curation, and taxonomy management).

---

## 2. System Architecture

```
                                  +---------------------------------------+
                                  |         Next.js App Router UI         |
                                  |    (React 18, Tailwind, Lucide Icons) |
                                  +-------------------+-------------------+
                                                      |
                                          HTTP / RESTful API Routes
                                                      |
                         +----------------------------+----------------------------+
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |     PostgreSQL 16 Engine      |                         |       MongoDB 8.2 Engine      |
         |    (ACID Relational Core)     |                         |    (Flexible Document Store)  |
         +---------------+---------------+                         +---------------+---------------+
                         |                                                         |
        +----------------+----------------+                                        |
        | - USERS (Auth & Roles)          |                                        |
        | - AUTHORS & RESEARCH_AREA       |                                        |
        | - RESEARCH_PAPER (Metadata)     |                                        |
        | - PAPER_AUTHOR & PAPER_AREA     |                                        |
        | - CITATION (Acyclic Graph)      |                                        |
        | - BOOKMARK & SEARCH_HISTORY     |                                        |
        | - GIN Index (Full-Text Search)  |                                        |
        +----------------+----------------+                                        |
                         |                                                         |
                         v                                                         v
         +-------------------------------+                         +-------------------------------+
         |       pgvector Extension      |                         |   paper_documents Collection  |
         |  - PAPER_EMBEDDINGS Table     |                         |   - full_text                 |
         |  - 384-D SentenceTransformer  |                         |   - sections (Array of subdocs)
         |  - Cosine Distance (<=>)      |                         |   - references (Array)        |
         |  - HNSW ANN Index             |                         |   - Aggregation Pipelines     |
         +-------------------------------+                         +-------------------------------+
```

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide React | Modern responsive academic UI, search interfaces, DBMS SQL workbench, citation exploration |
| **Backend API** | Next.js API Routes, Node.js v20+, TypeScript | 17 RESTful API endpoints, validation, RBAC, session management |
| **Relational Database** | PostgreSQL 16 (or Embedded PGlite WebAssembly) | Structured entities, 3NF normalization, views, triggers, stored procedures, GIN FTS |
| **Dense Vector Store** | pgvector extension | 384-dimensional dense vectors, HNSW indexing, `<=>` cosine similarity operator |
| **Document Database** | MongoDB 8.2 & Mongoose | Flexible paper documents, hierarchical sections, references, aggregation pipelines |
| **Semantic Embedding** | Sentence Transformers (`all-MiniLM-L6-v2`) | Unit-normalized 384-dimensional semantic embeddings from titles, abstracts, and full texts |
| **Authentication** | bcryptjs, jsonwebtoken, HTTP-Only Cookies | Industry-standard password hashing (10 rounds) and stateless session authorization |

---

## 4. Demo Accounts & Credentials

The seed database initializes preconfigured accounts for both system roles:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `student@research.edu` | `Password@123` | Keyword, semantic, and hybrid search; bookmark management; personalized recommendations; citation graphs; search history. |
| **Admin** | `admin@research.edu` | `Password@123` | Full student privileges + Admin Dashboard, add/edit/delete research papers, cross-DB synchronization, citation network management. |

---

## 5. Quickstart & Setup

### 5.1 Prerequisites
- **Node.js**: v18.17.0 or v20+
- **MongoDB**: Community Server running locally on port `27017` (e.g. `mongodb://127.0.0.1:27017/research_paper_db`)
- **PostgreSQL**: Native PostgreSQL 16 instance with pgvector, OR rely on the included zero-configuration **PGlite WebAssembly engine** which runs locally out of the box with zero setup!

### 5.2 Environment Configuration
Create or inspect the `.env` file in the project root:

```env
# Application Port
PORT=3000

# PostgreSQL Connection (Leave empty or point to Postgres; if unset, uses embedded PGlite)
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/research_paper_db

# MongoDB Connection
MONGODB_URI=mongodb://127.0.0.1:27017/research_paper_db

# JWT Secret & Security
JWT_SECRET=super_secure_research_discovery_jwt_secret_key_2026!
NODE_ENV=development
```

### 5.3 Installation & Seeding
> [!TIP]
> **Windows PowerShell Execution Policy Note:** If you see `npm.ps1 cannot be loaded because running scripts is disabled`, run:
> ```powershell
> npm.cmd run dev
> ```
> Or enable script execution once for your user account:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

1. **Install Dependencies:**
   ```bash
   npm.cmd install
   ```

2. **Run Migrations & Initialize Database Schemas (PostgreSQL & MongoDB):**
   ```bash
   npm.cmd run seed
   ```
   *Seeds all 12 PostgreSQL tables (110 papers, 35 authors, 9 areas, 12 journals, 20 conferences, 195 citations, 110 dense 384-D vector embeddings) and all 4 MongoDB collections (264 structured documents).*

3. **Run the Comprehensive Automated Test Suite:**
   ```bash
   npm.cmd test
   ```
   *Verifies all 51 assertions across 12 modules (100% pass rate).*

4. **Verify PostgreSQL Server Connection & Status:**
   ```bash
   npm.cmd run pg:verify
   ```
   *Inspects PostgreSQL connection on port 5432 and verifies PGlite fallback readiness.*

5. **Start Development Server with Live Query Logging:**
   ```bash
   npm.cmd run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Whenever you click buttons on the frontend (searching, bookmarking, adding/deleting papers, running SQL queries), the actual real-time queries and parameters stream immediately into that same PowerShell terminal!

6. **Migrate to Real PostgreSQL Server (Optional):**
   ```bash
   npm.cmd run pg:migrate
   ```
   *Copies all 110 research papers, 35 authors, and dense vectors from embedded PGlite to your native Windows PostgreSQL instance.*

7. **Build for Production:**
   ```bash
   npm.cmd run build
   npm.cmd run start
   ```

---

## 6. Database Architecture & Schema

### 6.1 PostgreSQL Relational Model (12 Tables)
The database implements 11 normalized tables and 1 vector embedding table according to `ER DIAGRAM.png`:
1. `USERS`: Student and Admin accounts with bcrypt password hashes.
2. `AUTHORS`: Distinct researcher entities with affiliations.
3. `RESEARCH_AREA`: Controlled taxonomy of computer science domains.
4. `JOURNAL`: Academic journal publication venues (`journal_id`, `journal_name`, `publisher`, `issn`).
5. `CONFERENCE`: Academic conference proceedings (`conference_id`, `conference_name`, `location`, `year`).
6. `RESEARCH_PAPER`: Core academic metadata (`doi`, `title`, `abstract`, `citation_count`, `source_type`, `journal_id`, `conference_id`, `publication_date`).
7. `PAPER_AUTHOR`: Composite primary key `(paper_id, author_id)` with author sequence ordering.
8. `PAPER_AREA`: Composite primary key `(paper_id, area_id)` mapping papers to domains.
9. `BOOKMARK`: Composite primary key `(user_id, paper_id)` with creation timestamp.
10. `SEARCH_HISTORY`: User search queries, timestamp, and search modality (`KEYWORD`, `SEMANTIC`, `HYBRID`).
11. `CITATION`: Directed graph edges `(citing_paper_id, cited_paper_id)` with anti-self-citation constraints.
12. `PAPER_EMBEDDINGS`: 384-dimensional dense vectors stored using the `vector(384)` type with HNSW index.

### 6.2 MongoDB Multi-Collection Document Architecture (4 Collections)
1. **`paper_documents` (110 documents):** Full narrative bodies, 4 structured sections (`Introduction`, `Methodology`, `Results`, `Conclusion`), bibliographic references arrays, and keywords.
2. **`author_documents` (35 documents):** Researcher biographical summaries, research interests arrays, external profiles (Google Scholar, ORCID), and citation metrics.
3. **`research_area_documents` (9 documents):** Sub-topic taxonomy hierarchies, emerging research trends, and top publication venues.
4. **`citation_documents` (110 documents):** Rich citation context snippets, section references, and incoming/outgoing influence metrics.

```json
{
  "paper_id": 1,
  "full_text": "Complete narrative paper text...",
  "sections": [
    { "heading": "Introduction", "content": "..." },
    { "heading": "Methodology", "content": "..." },
    { "heading": "Results", "content": "..." },
    { "heading": "Conclusion", "content": "..." }
  ],
  "references": [
    { "title": "Attention Is All You Need", "authors": ["Vaswani et al."], "year": 2017, "doi": "..." }
  ],
  "keywords": ["transformers", "attention mechanism", "nlp"],
  "metadata": {
    "language": "English",
    "document_type": "Research Article",
    "word_count": 8420,
    "reading_time_minutes": 28
  }
}
```

---

## 7. Advanced DBMS Implementation Checklist

| DBMS Concept | Implementation File | Verification & Details |
| :--- | :--- | :--- |
| **Relational Schema (12 Tables)** | `database/postgres/schema.sql` | 3NF/BCNF normalized, composite PKs, FKs to `JOURNAL` and `CONFERENCE` with `ON DELETE CASCADE`. |
| **Database Views (4 Views)** | `database/postgres/views.sql` | `paper_details_view`, `popular_papers_view`, `author_publication_view`, `user_bookmark_view`. |
| **Stored Functions (3)** | `database/postgres/functions.sql` | `get_papers_by_area`, `calculate_popular_papers`, `get_citation_stats`. |
| **Stored Procedures (1)** | `database/postgres/procedures.sql` | `add_research_paper_tx` executing transactional multi-table inserts. |
| **Triggers (3)** | `database/postgres/triggers.sql` | `trg_prevent_self_citation`, `trg_increment_citation_count`, `trg_decrement_citation_count`. |
| **Full-Text Search (GIN)** | `database/postgres/indexes.sql` | GIN index on `to_tsvector('english', title || ' ' || abstract)`. |
| **Vector Indexing (HNSW)** | `database/postgres/indexes.sql` | HNSW cosine vector index `vector_cosine_ops` on `PAPER_EMBEDDINGS`. |
| **ACID Transactions** | `app/api/papers/route.ts` | Multi-table `BEGIN` / `COMMIT` / `ROLLBACK` with cross-DB compensation. |
| **Recursive CTEs** | `app/api/papers/[id]/citations/route.ts` | Multi-hop citation graph traversal using `WITH RECURSIVE CitationGraph`. |
| **20 SQL Demonstrations** | `app/dbms/page.tsx` & `lib/dbms-queries.ts` | Interactive execution of all standard & advanced SQL query patterns including ER joins with `EXPLAIN ANALYZE`. |
| **Interactive Dual-DB CRUD**| `app/api/dbms/crud-demo/route.ts` | Step-by-step live INSERT/UPDATE/DELETE demonstrator with query audit log. |
| **Live Database Activity Monitor** | `lib/db/query-logger.ts` & `/dbms` | Real-time query streaming to PowerShell terminal and UI monitor with request correlation. |
| **NoSQL Aggregations** | `app/api/dbms/analytics/route.ts` | Multi-stage `$unwind`, `$group`, `$facet` pipelines over document collections. |

---

## 8. Search & Recommendation Modalities

### 8.1 PostgreSQL Lexical Keyword Search (`/search/keyword`)
- Utilizes `plainto_tsquery('english', $1)` and `websearch_to_tsquery`.
- Leverages inverted GIN index for sub-millisecond term matching.
- Ranks results using `ts_rank(search_vector, query)`.

### 8.2 pgvector Dense Semantic Search (`/search/semantic`)
- Encodes queries into 384-dimensional dense vectors using `all-MiniLM-L6-v2`.
- Queries PostgreSQL directly using the Cosine Distance operator (`<=>`):
  ```sql
  SELECT p.*, 1 - (e.embedding <=> $1::vector) AS similarity_score
  FROM research_paper p
  JOIN paper_embeddings e ON p.paper_id = e.paper_id
  ORDER BY e.embedding <=> $1::vector ASC
  LIMIT 10;
  ```

### 8.3 Hybrid Search with Reciprocal Rank Fusion (`/search/hybrid`)
- Merges keyword rank $r_{\text{FTS}}(d)$ and semantic rank $r_{\text{vector}}(d)$ using Reciprocal Rank Fusion ($k = 60$):
  $$RRF\_Score(d) = \frac{1}{60 + r_{\text{FTS}}(d)} + \frac{1}{60 + r_{\text{vector}}(d)}$$

### 8.4 Personalized Recommendations (`/recommendations`)
- Extracts the active user's bookmarked papers.
- Computes the average centroid vector:
  $$\mathbf{C} = \frac{1}{N} \sum_{i=1}^N \mathbf{v}_i$$
- Executes a nearest-neighbor query in pgvector to find candidate papers closest to $\mathbf{C}$ excluding existing bookmarks.

---

## 9. Automated Test Suite

Run the full end-to-end verification suite with:
```bash
npm.cmd test
```

### Test Coverage Summary:
- **Module 1: Authentication & Cryptographic Tests** (4/4 Passed)
- **Module 2: PostgreSQL Relational Schema (12 Tables)** (12/12 Passed)
- **Module 3: Relational Integrity, Constraints & ER Relationships** (4/4 Passed)
- **Module 4: Database Views Execution** (4/4 Passed)
- **Module 5: ACID Transactions & Atomicity Rollback** (1/1 Passed)
- **Module 6: Stored Functions, Procedures & Triggers** (3/3 Passed)
- **Module 7: Recursive Common Table Expressions (CTE)** (1/1 Passed)
- **Module 8: Full-Text Search (GIN Index & ts_rank)** (1/1 Passed)
- **Module 9: pgvector Cosine Similarity Search (384-D)** (2/2 Passed)
- **Module 10: MongoDB Document Storage & 4 Collections Verification** (9/9 Passed)
- **Module 11: Cross-Database Synchronization & Parity Checks** (6/6 Passed)
- **Module 12: Dynamic End-to-End Dual-DB CRUD Lifecycle** (4/4 Passed)
- **TOTAL: 51 PASSED / 0 FAILED (100% Pass Rate)**

Detailed test logs and verification output are available in [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

---

## 10. Documentation Index

Comprehensive technical documentation is organized in the `docs/` directory:
- 📊 [**Entity-Relationship Diagram (`docs/ER_DIAGRAM.md`)**](docs/ER_DIAGRAM.md): Complete Chen & Crow's Foot ER diagrams, cardinality, and relational mappings.
- 🗄️ [**Relational Schema Documentation (`docs/RELATIONAL_SCHEMA.md`)**](docs/RELATIONAL_SCHEMA.md): Complete data dictionary with column types, constraints, and index definitions.
- 🏗️ [**Multi-Model Architecture (`docs/DATABASE_ARCHITECTURE.md`)**](docs/DATABASE_ARCHITECTURE.md): Polyglot persistence, two-phase dual write with compensation, and CAP analysis.
- 📡 [**REST API Documentation (`docs/API_DOCUMENTATION.md`)**](docs/API_DOCUMENTATION.md): Complete OpenAPI-style documentation for all 17 RESTful endpoints.
- 🧪 [**Test Report (`docs/TEST_REPORT.md`)**](docs/TEST_REPORT.md): Complete test run transcript and verification report.

