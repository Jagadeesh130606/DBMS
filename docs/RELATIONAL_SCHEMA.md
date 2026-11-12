# Formal Relational Schema Documentation

**System Title:** Research Paper Discovery and Semantic Recommendation System  
**Engine:** PostgreSQL 16 (with pgvector extension) & Embedded PGlite  
**Normalization Level:** 3NF / BCNF Fully Normalized

---

## 1. Relational Table Definitions (12 Tables)

### Table 1: `USERS`
```sql
CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STUDENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table 2: `AUTHORS`
```sql
CREATE TABLE AUTHORS (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    affiliation VARCHAR(255),
    email VARCHAR(255)
);
```

### Table 3: `JOURNAL`
```sql
CREATE TABLE JOURNAL (
    journal_id SERIAL PRIMARY KEY,
    journal_name VARCHAR(255) NOT NULL UNIQUE,
    publisher VARCHAR(255) NOT NULL,
    issn VARCHAR(30) UNIQUE NOT NULL
);
```

### Table 4: `CONFERENCE`
```sql
CREATE TABLE CONFERENCE (
    conference_id SERIAL PRIMARY KEY,
    conference_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1950 AND year <= 2100)
);
```

### Table 5: `RESEARCH_PAPER`
```sql
CREATE TABLE RESEARCH_PAPER (
    paper_id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    doi VARCHAR(100) NOT NULL UNIQUE,
    publication_date DATE NOT NULL,
    citation_count INTEGER NOT NULL DEFAULT 0 CHECK (citation_count >= 0),
    source VARCHAR(255) NOT NULL,
    source_type VARCHAR(50) DEFAULT 'CONFERENCE' CHECK (source_type IN ('JOURNAL', 'CONFERENCE', 'PREPRINT')),
    journal_id INTEGER REFERENCES JOURNAL(journal_id) ON DELETE SET NULL ON UPDATE CASCADE,
    conference_id INTEGER REFERENCES CONFERENCE(conference_id) ON DELETE SET NULL ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table 6: `RESEARCH_AREA`
```sql
CREATE TABLE RESEARCH_AREA (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);
```

### Table 7: `PAPER_AUTHOR` (M:N Junction)
```sql
CREATE TABLE PAPER_AUTHOR (
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_id INTEGER NOT NULL REFERENCES AUTHORS(author_id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1 CHECK (author_order > 0),
    PRIMARY KEY (paper_id, author_id)
);
```

### Table 8: `PAPER_AREA` (M:N Junction)
```sql
CREATE TABLE PAPER_AREA (
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    area_id INTEGER NOT NULL REFERENCES RESEARCH_AREA(area_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (paper_id, area_id)
);
```

### Table 9: `BOOKMARK` (1:N Library)
```sql
CREATE TABLE BOOKMARK (
    user_id INTEGER NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, paper_id)
);
```

### Table 10: `SEARCH_HISTORY` (Audit Queries)
```sql
CREATE TABLE SEARCH_HISTORY (
    search_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('KEYWORD', 'SEMANTIC', 'HYBRID', 'FILTER')),
    search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Table 11: `CITATION` (Recursive Citation Network)
```sql
CREATE TABLE CITATION (
    citing_paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    cited_paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (citing_paper_id, cited_paper_id),
    CHECK (citing_paper_id <> cited_paper_id)
);
```

### Table 12: `PAPER_EMBEDDINGS` (Dense Vector Storage)
```sql
CREATE TABLE PAPER_EMBEDDINGS (
    embedding_id SERIAL PRIMARY KEY,
    paper_id INTEGER NOT NULL UNIQUE REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    embedding vector(384) NOT NULL,
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 2. Relational Views

1. `paper_details_view`: Joined denormalized projection combining papers, ordered authors, areas, journals, and conferences.
2. `popular_papers_view`: Computed popularity index ranking papers using `DENSE_RANK() OVER (...)`.
3. `author_publication_view`: Aggregated author metrics, publication counts, and cumulative citations.
4. `user_bookmark_view`: Denormalized saved papers mapped per user.
