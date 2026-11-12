# REST API Specification & Endpoint Documentation

The Research Paper Discovery and Semantic Recommendation platform provides a fully documented RESTful API implemented using Next.js Route Handlers. All responses follow standard JSON formatting and HTTP status codes.

---

## 1. Authentication & Session Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Endpoint:** `/api/auth/register`
- **Access:** Public
- **Description:** Registers a new student user with bcrypt password hashing (10 rounds).
- **Request Body:**
  ```json
  {
    "name": "Jane Researcher",
    "email": "jane@university.edu",
    "password": "Password@123",
    "role": "STUDENT"
  }
  ```
- **Responses:**
  - `201 Created`: User created successfully. Sets HTTP-only authentication cookie `auth_token`.
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "user": {
        "user_id": 11,
        "name": "Jane Researcher",
        "email": "jane@university.edu",
        "role": "STUDENT"
      }
    }
    ```
  - `400 Bad Request`: Validation failure or email already exists.
    ```json
    { "error": "Email is already registered" }
    ```

### 1.2 User Login
- **Method:** `POST`
- **Endpoint:** `/api/auth/login`
- **Access:** Public
- **Description:** Authenticates user credentials using bcrypt compare and issues a signed JWT stored in an HTTP-only cookie.
- **Request Body:**
  ```json
  {
    "email": "student@research.edu",
    "password": "Password@123"
  }
  ```
- **Responses:**
  - `200 OK`: Successful authentication.
    ```json
    {
      "success": true,
      "user": {
        "user_id": 1,
        "name": "Alice Johnson",
        "email": "student@research.edu",
        "role": "STUDENT"
      }
    }
    ```
  - `401 Unauthorized`: Invalid credentials.
    ```json
    { "error": "Invalid email or password" }
    ```

### 1.3 User Logout
- **Method:** `POST`
- **Endpoint:** `/api/auth/logout`
- **Access:** Public (Authenticated)
- **Description:** Clears the `auth_token` HTTP-only cookie.
- **Responses:**
  - `200 OK`:
    ```json
    { "success": true, "message": "Logged out successfully" }
    ```

### 1.4 Get Current User Session
- **Method:** `GET`
- **Endpoint:** `/api/auth/me`
- **Access:** Public (Reads cookie)
- **Description:** Returns the active user profile or null if not authenticated.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "user": {
        "user_id": 1,
        "name": "Alice Johnson",
        "email": "student@research.edu",
        "role": "STUDENT"
      }
    }
    ```

---

## 2. Dashboard & Analytics

### 2.1 Summary Metrics
- **Method:** `GET`
- **Endpoint:** `/api/dashboard`
- **Access:** Public
- **Description:** Aggregates real-time relational counts and statistics from PostgreSQL.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "counts": {
        "papers": 32,
        "authors": 15,
        "areas": 8,
        "citations": 44
      },
      "recent_papers": [
        {
          "paper_id": 1,
          "title": "Attention Is All You Need",
          "publication_date": "2017-06-12",
          "citation_count": 92450,
          "authors": ["Ashish Vaswani", "Noam Shazeer"]
        }
      ],
      "popular_areas": [
        { "area_name": "Deep Learning", "paper_count": 9 }
      ],
      "most_bookmarked": [
        { "paper_id": 1, "title": "Attention Is All You Need", "bookmark_count": 4 }
      ]
    }
    ```

### 2.2 MongoDB Aggregation Pipelines
- **Method:** `GET`
- **Endpoint:** `/api/dbms/analytics`
- **Access:** Public
- **Description:** Runs 4 multi-stage MongoDB aggregation pipelines over `paper_documents`.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "keyword_distribution": [
        { "keyword": "deep learning", "count": 14 }
      ],
      "section_metrics": [
        { "heading": "Introduction", "avg_length": 1450, "count": 32 }
      ],
      "reference_distribution": [
        { "range": "10-25 references", "paper_count": 18 }
      ],
      "document_types": [
        { "type": "Research Article", "count": 32 }
      ]
    }
    ```

---

## 3. Research Paper Management

### 3.1 List & Filter Papers
- **Method:** `GET`
- **Endpoint:** `/api/papers`
- **Access:** Public
- **Query Parameters:**
  - `search` (string): Text filter matching title or abstract.
  - `area_id` (integer): Filter by research area ID.
  - `author_id` (integer): Filter by author ID.
  - `source` (string): Filter by publication venue (e.g., `NeurIPS`, `IEEE`).
  - `sort_by` (string): `publication_date`, `citation_count`, or `title` (default: `publication_date`).
  - `order` (string): `ASC` or `DESC` (default: `DESC`).
  - `page` (integer): Pagination offset (default: 1).
  - `limit` (integer): Page size (default: 12).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "papers": [
        {
          "paper_id": 1,
          "title": "Attention Is All You Need",
          "abstract": "The dominant sequence transduction models...",
          "doi": "10.48550/arXiv.1706.03762",
          "publication_date": "2017-06-12",
          "citation_count": 92450,
          "source": "NeurIPS",
          "authors": ["Ashish Vaswani", "Noam Shazeer"],
          "areas": ["Natural Language Processing", "Deep Learning"]
        }
      ],
      "pagination": { "page": 1, "limit": 12, "total": 32, "pages": 3 }
    }
    ```

### 3.2 Create Research Paper (Multi-Model Transaction)
- **Method:** `POST`
- **Endpoint:** `/api/papers`
- **Access:** Admin only
- **Description:** Atomically creates relational entries in PostgreSQL, inserts the 384-D vector into `PAPER_EMBEDDINGS`, and stores the full document in MongoDB with explicit compensation on failure.
- **Request Body:**
  ```json
  {
    "title": "Scalable Vector Search in Relational Databases",
    "abstract": "We evaluate high-dimensional indexing strategies...",
    "doi": "10.1145/9999999.8888888",
    "publication_date": "2024-05-15",
    "source": "ACM SIGMOD 2024",
    "citation_count": 0,
    "author_ids": [1, 2],
    "area_ids": [1, 3],
    "full_text": "Complete full text content of the paper...",
    "sections": [
      { "heading": "Introduction", "content": "Vector similarity search has become..." },
      { "heading": "Methodology", "content": "We implement HNSW indexes..." }
    ],
    "references": [
      { "title": "Efficient and Robust Approximate Nearest Neighbor Search", "authors": ["Malkov, Y. A."], "year": 2018, "doi": "10.1109/TPAMI.2018.2889473" }
    ],
    "keywords": ["vector search", "databases", "HNSW"]
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    { "success": true, "paper_id": 33, "message": "Paper created successfully across PostgreSQL and MongoDB" }
    ```
  - `400 Bad Request`: Missing required fields or duplicate DOI.
  - `403 Forbidden`: User does not hold ADMIN role.
  - `500 Internal Server Error`: Transaction rolled back and compensation executed.

### 3.3 Get Paper Details
- **Method:** `GET`
- **Endpoint:** `/api/papers/[id]`
- **Access:** Public
- **Description:** Combines relational metadata from PostgreSQL with unstructured sections, references, and keywords from MongoDB.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "paper": {
        "paper_id": 1,
        "title": "Attention Is All You Need",
        "abstract": "The dominant sequence transduction models...",
        "doi": "10.48550/arXiv.1706.03762",
        "publication_date": "2017-06-12",
        "citation_count": 92450,
        "source": "NeurIPS",
        "authors": [
          { "author_id": 1, "name": "Ashish Vaswani", "affiliation": "Google Brain" }
        ],
        "areas": [
          { "area_id": 1, "area_name": "Natural Language Processing" }
        ],
        "document": {
          "full_text": "...",
          "sections": [
            { "heading": "Introduction", "content": "..." },
            { "heading": "Model Architecture", "content": "..." }
          ],
          "references": [
            { "title": "Neural Machine Translation by Jointly Learning to Align and Translate", "year": 2014 }
          ],
          "keywords": ["transformers", "attention", "deep learning"]
        }
      }
    }
    ```
  - `404 Not Found`: Paper with specified ID does not exist.

### 3.4 Delete Research Paper
- **Method:** `DELETE`
- **Endpoint:** `/api/papers/[id]`
- **Access:** Admin only
- **Description:** Cascades deletion across all PostgreSQL tables and deletes the associated MongoDB document.
- **Responses:**
  - `200 OK`:
    ```json
    { "success": true, "message": "Paper and associated documents deleted" }
    ```

### 3.5 Explore Citation Graph (Recursive CTE)
- **Method:** `GET`
- **Endpoint:** `/api/papers/[id]/citations`
- **Access:** Public
- **Description:** Retrieves incoming citations, outgoing references, and multi-hop recursive traversal results.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "paper_id": 1,
      "title": "Attention Is All You Need",
      "incoming_citations": [
        { "paper_id": 2, "title": "BERT: Pre-training of Deep Bidirectional Transformers..." }
      ],
      "outgoing_citations": [
        { "paper_id": 7, "title": "Deep Residual Learning for Image Recognition" }
      ],
      "recursive_network": [
        { "paper_id": 3, "title": "Language Models are Few-Shot Learners", "depth": 2 }
      ]
    }
    ```

---

## 4. Search Endpoints

### 4.1 Keyword Search (PostgreSQL Full-Text Search)
- **Method:** `GET`
- **Endpoint:** `/api/search/keyword`
- **Access:** Public
- **Query Parameters:**
  - `q` (string, required): Query string.
  - `limit` (integer): Results limit (default: 10).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "mode": "keyword",
      "query": "transformer attention",
      "results": [
        {
          "paper_id": 1,
          "title": "Attention Is All You Need",
          "abstract": "The dominant sequence transduction models...",
          "score": 0.892,
          "authors": ["Ashish Vaswani", "Noam Shazeer"],
          "areas": ["Natural Language Processing"]
        }
      ]
    }
    ```

### 4.2 Semantic Search (pgvector Cosine Similarity)
- **Method:** `GET`
- **Endpoint:** `/api/search/semantic`
- **Access:** Public
- **Query Parameters:**
  - `q` (string, required): Natural language conceptual query.
  - `limit` (integer): Results limit (default: 10).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "mode": "semantic",
      "query": "how do models translate languages without recurrence?",
      "results": [
        {
          "paper_id": 1,
          "title": "Attention Is All You Need",
          "abstract": "The dominant sequence transduction models...",
          "similarity": 0.864,
          "authors": ["Ashish Vaswani", "Noam Shazeer"],
          "areas": ["Natural Language Processing"]
        }
      ]
    }
    ```

### 4.3 Hybrid Search (Reciprocal Rank Fusion)
- **Method:** `GET`
- **Endpoint:** `/api/search/hybrid`
- **Access:** Public
- **Query Parameters:**
  - `q` (string, required): Search query.
  - `limit` (integer): Results limit (default: 10).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "mode": "hybrid",
      "strategy": "Reciprocal Rank Fusion (k=60)",
      "query": "deep neural networks for vision",
      "results": [
        {
          "paper_id": 7,
          "title": "Deep Residual Learning for Image Recognition",
          "rrf_score": 0.0327,
          "fts_rank": 1,
          "semantic_rank": 2,
          "authors": ["Kaiming He", "Xiangyu Zhang"]
        }
      ]
    }
    ```

---

## 5. Semantic Recommendations

### 5.1 Personalized & Similar Recommendations
- **Method:** `GET`
- **Endpoint:** `/api/recommendations`
- **Access:** Authenticated (Student/Admin) or Public (returns global trending)
- **Description:** Computes the centroid vector of the user's bookmarked research papers and performs a pgvector cosine similarity search to surface unbookmarked nearest neighbors.
- **Responses:**
  - `200 OK`:
    ```json
    {
      "method": "bookmark_centroid_vector_similarity",
      "recommendations": [
        {
          "paper_id": 2,
          "title": "BERT: Pre-training of Deep Bidirectional Transformers",
          "similarity_score": 0.871,
          "rationale": "Recommended because you saved Attention Is All You Need"
        }
      ]
    }
    ```

---

## 6. Bookmark Management

### 6.1 Get User Bookmarks
- **Method:** `GET`
- **Endpoint:** `/api/bookmarks`
- **Access:** Authenticated
- **Responses:**
  - `200 OK`:
    ```json
    {
      "bookmarks": [
        {
          "paper_id": 1,
          "title": "Attention Is All You Need",
          "doi": "10.48550/arXiv.1706.03762",
          "saved_at": "2026-10-31T09:12:00Z"
        }
      ]
    }
    ```

### 6.2 Add Bookmark
- **Method:** `POST`
- **Endpoint:** `/api/bookmarks`
- **Access:** Authenticated
- **Request Body:** `{ "paper_id": 1 }`
- **Responses:**
  - `201 Created`: `{ "success": true, "message": "Bookmark created" }`
  - `409 Conflict`: Bookmark already exists for this user.

### 6.3 Remove Bookmark
- **Method:** `DELETE`
- **Endpoint:** `/api/bookmarks/[id]`
- **Access:** Authenticated
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Bookmark removed" }`

---

## 7. Search History

### 7.1 View Search History
- **Method:** `GET`
- **Endpoint:** `/api/search-history`
- **Access:** Authenticated
- **Responses:**
  - `200 OK`:
    ```json
    {
      "history": [
        {
          "search_id": 5,
          "search_query": "transformers in vision",
          "search_type": "HYBRID",
          "search_date": "2026-10-31T10:15:30Z"
        }
      ]
    }
    ```

### 7.2 Delete Search History Entry
- **Method:** `DELETE`
- **Endpoint:** `/api/search-history/[id]`
- **Access:** Authenticated
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "History item deleted" }`

---

## 8. Taxonomy Endpoints

### 8.1 List Authors
- **Method:** `GET`
- **Endpoint:** `/api/authors`
- **Access:** Public
- **Responses:**
  - `200 OK`:
    ```json
    [
      { "author_id": 1, "name": "Ashish Vaswani", "affiliation": "Google Brain", "paper_count": 3 }
    ]
    ```

### 8.2 List Research Areas
- **Method:** `GET`
- **Endpoint:** `/api/areas`
- **Access:** Public
- **Responses:**
  - `200 OK`:
    ```json
    [
      { "area_id": 1, "area_name": "Natural Language Processing", "description": "Computational linguistics...", "paper_count": 8 }
    ]
    ```

---

## 9. DBMS Demonstration Suite

### 9.1 List SQL Demonstration Queries
- **Method:** `GET`
- **Endpoint:** `/api/dbms/queries`
- **Access:** Public
- **Description:** Returns metadata and SQL syntax for all 18 DBMS query patterns (Basic SELECT, WHERE, ORDER BY, GROUP BY, HAVING, INNER/LEFT/RIGHT JOIN, Multi-Join, Aggregates, Subqueries, Correlated Subqueries, EXISTS, UNION, CTE, Recursive CTE, Window Functions).

### 9.2 Execute Query with Execution Plan
- **Method:** `POST`
- **Endpoint:** `/api/dbms/execute`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "query_id": "window_functions",
    "custom_sql": "SELECT title, citation_count, RANK() OVER (ORDER BY citation_count DESC) FROM research_paper LIMIT 5;"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "results": [ ... ],
      "execution_plan": [
        "Limit  (cost=1.40..1.48 rows=5 width=44)",
        "  ->  WindowAgg  (cost=1.40..2.04 rows=32 width=44)",
        "        ->  Sort  (cost=1.40..1.48 rows=32 width=40)",
        "              Sort Key: citation_count DESC",
        "              ->  Seq Scan on research_paper  (cost=0.00..1.32 rows=32 width=40)"
      ],
      "execution_time_ms": 1.42
    }
    ```

