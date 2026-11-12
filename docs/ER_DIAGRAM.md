# Entity-Relationship (ER) Diagram & Specification

## 1. Overview
The **Research Paper Discovery and Semantic Recommendation System** utilizes a normalized relational data model for structured academic interactions, coupled with an unstructured document model in MongoDB and a vector embedding space in pgvector.

The relational model implements **9 core entities** in accordance with the provided Chen notation ER diagram.

---

## 2. Chen Notation ER Diagram Representation

```mermaid
erDiagram
    USER ||--o{ BOOKMARK : "creates (1:N)"
    USER ||--o{ SEARCH_HISTORY : "performs (1:N)"
    
    RESEARCH_PAPER ||--o{ BOOKMARK : "saved_in (1:N)"
    RESEARCH_PAPER ||--|{ PAPER_AUTHOR : "written_by (M:N)"
    AUTHORS ||--|{ PAPER_AUTHOR : "participates_in (1:M)"
    
    RESEARCH_PAPER ||--|{ PAPER_AREA : "categorized_under (M:N)"
    RESEARCH_AREA ||--|{ PAPER_AREA : "contains (1:M)"
    
    RESEARCH_PAPER ||--o{ CITATION : "cites / cited_by (Recursive M:N)"
    
    RESEARCH_PAPER ||--|| PAPER_EMBEDDINGS : "has_vector (1:1 Extension)"

    USER {
        int user_id PK
        string name
        string email UK
        string password_hash
        string role "ADMIN | STUDENT"
        timestamp created_at
    }

    AUTHORS {
        int author_id PK
        string name
        string affiliation
        string email
    }

    RESEARCH_PAPER {
        int paper_id PK
        string title
        text abstract
        string doi UK
        date publication_date
        int citation_count
        string source "Conference | Journal"
        timestamp created_at
    }

    RESEARCH_AREA {
        int area_id PK
        string area_name UK
        text description
    }

    PAPER_AUTHOR {
        int paper_id PK,FK
        int author_id PK,FK
        int author_order
    }

    PAPER_AREA {
        int paper_id PK,FK
        int area_id PK,FK
    }

    BOOKMARK {
        int user_id PK,FK
        int paper_id PK,FK
        timestamp created_at
    }

    SEARCH_HISTORY {
        int search_id PK
        int user_id FK
        text search_query
        string search_type "KEYWORD | SEMANTIC | HYBRID"
        timestamp search_date
    }

    CITATION {
        int citing_paper_id PK,FK
        int cited_paper_id PK,FK
    }

    PAPER_EMBEDDINGS {
        int embedding_id PK
        int paper_id FK,UK
        vector embedding "384-D Vector"
        string embedding_model
        timestamp created_at
    }
```

---

## 3. Entity Specification (Chen Notation Attributes)

### Entity 1: USER
- **Attributes**: `User_ID` (Key Attribute, underlined), `Name`, `Email` (Candidate Key), `Password_Hash`, `Role` ('ADMIN' or 'STUDENT').
- **Relationships**:
  - `PERFORMS` (1:N with `SEARCH_HISTORY`)
  - `BOOKMARKS` (1:N with `RESEARCH_PAPER` via associative entity `BOOKMARK`)

### Entity 2: AUTHORS
- **Attributes**: `Author_ID` (Key Attribute, underlined), `Name`, `Affiliation`, `Email`.
- **Relationships**:
  - `WRITES` (M:N with `RESEARCH_PAPER` resolved via `PAPER_AUTHOR`)

### Entity 3: RESEARCH_PAPER
- **Attributes**: `Paper_ID` (Key Attribute, underlined), `Title`, `Abstract`, `DOI` (Candidate Key), `Publication_Date`, `Citation_Count` (Derived / Trigger maintained attribute), `Source` (Publication Venue).
- **Relationships**:
  - `WRITES` (M:N with `AUTHORS`)
  - `BELONGS_TO` (M:N with `RESEARCH_AREA`)
  - `BOOKMARKS` (M:N with `USER`)
  - `CITES` (Recursive M:N Self-Relationship: a paper can cite many papers; a paper can be cited by many papers)
  - `HAS_EMBEDDING` (1:1 Extension with `PAPER_EMBEDDINGS`)

### Entity 4: RESEARCH_AREA
- **Attributes**: `Area_ID` (Key Attribute, underlined), `Area_Name` (Unique), `Description`.
- **Relationships**:
  - `BELONGS_TO` (1:N with `PAPER_AREA`)

### Entity 5: SEARCH_HISTORY
- **Attributes**: `Search_ID` (Key Attribute, underlined), `Search_Query`, `Search_Type`, `Search_Date`.
- **Relationships**:
  - `PERFORMS` (N:1 with `USER`)

### Entity 6: CITATION (Recursive Edge)
- **Attributes**: `Citing_Paper_ID` (FK to `RESEARCH_PAPER`), `Cited_Paper_ID` (FK to `RESEARCH_PAPER`).
- **Constraint**: `citing_paper_id <> cited_paper_id` (a paper cannot cite itself).

---

## 4. Multi-Model Separation
- **PostgreSQL**: Stores the 9 relational tables and views.
- **pgvector**: Stores dense 384-dimensional sentence transformer embeddings (`PAPER_EMBEDDINGS`) linked via foreign key to `RESEARCH_PAPER`.
- **MongoDB**: Stores full-text research articles (`paper_documents`), section hierarchies (Introduction, Methodology, Results, Conclusion), citations array, and flexible unstructured metadata linked by logical foreign key `paper_id`.

