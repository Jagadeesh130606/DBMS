-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Relational Schema (Level-3 DBMS Architecture)
-- =========================================================================

-- Enable pgvector extension for dense vector similarity operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing tables with CASCADE for repeatable migrations
DROP TABLE IF EXISTS CITATION CASCADE;
DROP TABLE IF EXISTS SEARCH_HISTORY CASCADE;
DROP TABLE IF EXISTS BOOKMARK CASCADE;
DROP TABLE IF EXISTS PAPER_AREA CASCADE;
DROP TABLE IF EXISTS PAPER_AUTHOR CASCADE;
DROP TABLE IF EXISTS PAPER_EMBEDDINGS CASCADE;
DROP TABLE IF EXISTS RESEARCH_AREA CASCADE;
DROP TABLE IF EXISTS RESEARCH_PAPER CASCADE;
DROP TABLE IF EXISTS CONFERENCE CASCADE;
DROP TABLE IF EXISTS JOURNAL CASCADE;
DROP TABLE IF EXISTS AUTHORS CASCADE;
DROP TABLE IF EXISTS USERS CASCADE;

-- -------------------------------------------------------------------------
-- TABLE 1: USERS
-- Purpose: System authentication, authorization (Admin vs Student), audit
-- -------------------------------------------------------------------------
CREATE TABLE USERS (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'STUDENT')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -------------------------------------------------------------------------
-- TABLE 2: AUTHORS
-- Purpose: Academic researchers, scholars, affiliations, contact info
-- -------------------------------------------------------------------------
CREATE TABLE AUTHORS (
    author_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    affiliation VARCHAR(255),
    email VARCHAR(255)
);

-- -------------------------------------------------------------------------
-- TABLE 3: JOURNAL
-- Purpose: Academic journals, publishers, and standard ISSN numbers
-- -------------------------------------------------------------------------
CREATE TABLE JOURNAL (
    journal_id SERIAL PRIMARY KEY,
    journal_name VARCHAR(255) NOT NULL UNIQUE,
    publisher VARCHAR(255) NOT NULL,
    issn VARCHAR(30) UNIQUE NOT NULL
);

-- -------------------------------------------------------------------------
-- TABLE 4: CONFERENCE
-- Purpose: Academic conferences, venues, host cities, and editions
-- -------------------------------------------------------------------------
CREATE TABLE CONFERENCE (
    conference_id SERIAL PRIMARY KEY,
    conference_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL CHECK (year >= 1950 AND year <= 2100)
);

-- -------------------------------------------------------------------------
-- TABLE 5: RESEARCH_PAPER
-- Purpose: Core relational entity storing structured paper metadata
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- TABLE 4: RESEARCH_AREA
-- Purpose: Taxonomical classification of computer science / academic domains
-- -------------------------------------------------------------------------
CREATE TABLE RESEARCH_AREA (
    area_id SERIAL PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- -------------------------------------------------------------------------
-- TABLE 5: PAPER_AUTHOR
-- Purpose: M:N relationship linking Research Papers to Authors with ordering
-- -------------------------------------------------------------------------
CREATE TABLE PAPER_AUTHOR (
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_id INTEGER NOT NULL REFERENCES AUTHORS(author_id) ON DELETE CASCADE ON UPDATE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1 CHECK (author_order > 0),
    PRIMARY KEY (paper_id, author_id)
);

-- -------------------------------------------------------------------------
-- TABLE 6: PAPER_AREA
-- Purpose: M:N relationship categorizing Research Papers into Research Areas
-- -------------------------------------------------------------------------
CREATE TABLE PAPER_AREA (
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    area_id INTEGER NOT NULL REFERENCES RESEARCH_AREA(area_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (paper_id, area_id)
);

-- -------------------------------------------------------------------------
-- TABLE 7: BOOKMARK
-- Purpose: 1:N user saved research papers for personalized library & recs
-- -------------------------------------------------------------------------
CREATE TABLE BOOKMARK (
    user_id INTEGER NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, paper_id)
);

-- -------------------------------------------------------------------------
-- TABLE 8: SEARCH_HISTORY
-- Purpose: 1:N log of user queries across Keyword, Semantic, and Hybrid
-- -------------------------------------------------------------------------
CREATE TABLE SEARCH_HISTORY (
    search_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES USERS(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    search_query TEXT NOT NULL,
    search_type VARCHAR(50) NOT NULL CHECK (search_type IN ('KEYWORD', 'SEMANTIC', 'HYBRID', 'FILTER')),
    search_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- -------------------------------------------------------------------------
-- TABLE 9: CITATION
-- Purpose: Recursive M:N citation graph linking citing paper to cited paper
-- Constraint: citing_paper_id != cited_paper_id (A paper cannot cite itself)
-- -------------------------------------------------------------------------
CREATE TABLE CITATION (
    citing_paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    cited_paper_id INTEGER NOT NULL REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (citing_paper_id, cited_paper_id),
    CHECK (citing_paper_id <> cited_paper_id)
);

-- -------------------------------------------------------------------------
-- TABLE 10: PAPER_EMBEDDINGS (pgvector Extension)
-- Purpose: Dense 384-dimensional vector embeddings for semantic similarity
-- -------------------------------------------------------------------------
CREATE TABLE PAPER_EMBEDDINGS (
    embedding_id SERIAL PRIMARY KEY,
    paper_id INTEGER NOT NULL UNIQUE REFERENCES RESEARCH_PAPER(paper_id) ON DELETE CASCADE ON UPDATE CASCADE,
    embedding vector(384) NOT NULL,
    embedding_model VARCHAR(100) NOT NULL DEFAULT 'all-MiniLM-L6-v2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
