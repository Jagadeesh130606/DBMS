# Relational Database Schema & Data Dictionary

## 1. Relational Schema (Third Normal Form - 3NF)

Every relational entity in the system satisfies Third Normal Form (3NF):
- **1NF**: All column attributes are atomic. Repeating groups (authors, research areas, citations) are resolved into associative intersection tables (`PAPER_AUTHOR`, `PAPER_AREA`, `CITATION`).
- **2NF**: No non-key attribute is partially dependent on any component of a composite primary key. In `PAPER_AUTHOR(paper_id, author_id)`, `author_order` depends on the exact combination of paper and author.
- **3NF**: No transitive functional dependencies exist. Non-key attributes depend solely on the primary candidate key.

---

## 2. Table Definitions

### 1. `USERS`
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `SERIAL` | NO | `PRIMARY KEY` | Unique synthetic identifier |
| `name` | `VARCHAR(150)` | NO | None | Full user name |
| `email` | `VARCHAR(255)` | NO | `UNIQUE` | User login and email address |
| `password_hash` | `VARCHAR(255)` | NO | None | Bcrypt password hash |
| `role` | `VARCHAR(20)` | NO | `CHECK (role IN ('ADMIN','STUDENT'))` | Role-based authorization |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp |

### 2. `AUTHORS`
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `author_id` | `SERIAL` | NO | `PRIMARY KEY` | Unique author identifier |
| `name` | `VARCHAR(150)` | NO | None | Academic scholar full name |
| `affiliation` | `VARCHAR(255)` | YES | None | University or laboratory |
| `email` | `VARCHAR(255)` | YES | None | Academic contact email |

### 3. `RESEARCH_PAPER`
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `paper_id` | `SERIAL` | NO | `PRIMARY KEY` | Core paper identifier |
| `title` | `VARCHAR(500)` | NO | None | Full academic paper title |
| `abstract` | `TEXT` | NO | None | Complete paper abstract |
| `doi` | `VARCHAR(100)` | NO | `UNIQUE` | Digital Object Identifier |
| `publication_date` | `DATE` | NO | None | Official publication date |
| `citation_count` | `INTEGER` | NO | `DEFAULT 0, CHECK (citation_count >= 0)` | Trigger-maintained count |
| `source` | `VARCHAR(255)` | NO | None | Conference or journal source |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Ingestion timestamp |

### 4. `RESEARCH_AREA`
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `area_id` | `SERIAL` | NO | `PRIMARY KEY` | Unique area identifier |
| `area_name` | `VARCHAR(100)` | NO | `UNIQUE` | Domain title |
| `description` | `TEXT` | YES | None | Taxonomy description |

### 5. `PAPER_AUTHOR` (Composite Associative Table)
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `paper_id` | `INTEGER` | NO | `REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | Composite PK part 1 |
| `author_id` | `INTEGER` | NO | `REFERENCES AUTHORS(author_id) ON DELETE CASCADE` | Composite PK part 2 |
| `author_order` | `INTEGER` | NO | `DEFAULT 1, CHECK (author_order > 0)` | Authorship sequence |

### 6. `PAPER_AREA` (Composite Associative Table)
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `paper_id` | `INTEGER` | NO | `REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | Composite PK part 1 |
| `area_id` | `INTEGER` | NO | `REFERENCES RESEARCH_AREA(area_id) ON DELETE CASCADE` | Composite PK part 2 |

### 7. `BOOKMARK` (Composite User Saved Papers)
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | `INTEGER` | NO | `REFERENCES USERS(user_id) ON DELETE CASCADE` | Composite PK part 1 |
| `paper_id` | `INTEGER` | NO | `REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | Composite PK part 2 |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Bookmark timestamp |

### 8. `SEARCH_HISTORY`
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `search_id` | `SERIAL` | NO | `PRIMARY KEY` | Audit log record ID |
| `user_id` | `INTEGER` | NO | `REFERENCES USERS(user_id) ON DELETE CASCADE` | User initiating query |
| `search_query` | `TEXT` | NO | None | Executed query string |
| `search_type` | `VARCHAR(50)` | NO | `CHECK (search_type IN ('KEYWORD','SEMANTIC','HYBRID','FILTER'))` | Search modality |
| `search_date` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Timestamp of inquiry |

### 9. `CITATION` (Recursive Directed Citation Graph)
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `citing_paper_id` | `INTEGER` | NO | `REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | The paper citing another |
| `cited_paper_id` | `INTEGER` | NO | `REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | The paper being cited |
| *Constraint* | - | - | `CHECK (citing_paper_id <> cited_paper_id)` | Self-citation disallowed |

### 10. `PAPER_EMBEDDINGS` (pgvector Extension)
| Column | Data Type | Nullable | Constraints / Defaults | Description |
| :--- | :--- | :--- | :--- | :--- |
| `embedding_id` | `SERIAL` | NO | `PRIMARY KEY` | Vector identifier |
| `paper_id` | `INTEGER` | NO | `UNIQUE, REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE` | Paper linkage |
| `embedding` | `vector(384)` | NO | None | 384-dimensional dense vector |
| `embedding_model` | `VARCHAR(100)` | NO | `DEFAULT 'all-MiniLM-L6-v2'` | Sentence Transformer name |
| `created_at` | `TIMESTAMPTZ` | NO | `DEFAULT CURRENT_TIMESTAMP` | Vector calculation date |

