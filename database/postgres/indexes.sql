-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Database Indexes (Level-3 DBMS Architecture)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. B-TREE INDEXES FOR RAPID SCANS AND SORTING
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON USERS(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON USERS(role);

CREATE INDEX IF NOT EXISTS idx_research_paper_doi ON RESEARCH_PAPER(doi);
CREATE INDEX IF NOT EXISTS idx_research_paper_pub_date ON RESEARCH_PAPER(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_paper_citations ON RESEARCH_PAPER(citation_count DESC);
CREATE INDEX IF NOT EXISTS idx_research_paper_source ON RESEARCH_PAPER(source);

CREATE INDEX IF NOT EXISTS idx_authors_name ON AUTHORS(name);
CREATE INDEX IF NOT EXISTS idx_research_area_name ON RESEARCH_AREA(area_name);

-- -------------------------------------------------------------------------
-- 2. COMPOSITE INDEXES FOR FOREIGN KEY RELATIONSHIPS & JOIN OPTIMIZATION
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_paper_author_composite ON PAPER_AUTHOR(paper_id, author_id, author_order);
CREATE INDEX IF NOT EXISTS idx_paper_author_reverse ON PAPER_AUTHOR(author_id, paper_id);

CREATE INDEX IF NOT EXISTS idx_paper_area_composite ON PAPER_AREA(paper_id, area_id);
CREATE INDEX IF NOT EXISTS idx_paper_area_reverse ON PAPER_AREA(area_id, paper_id);

CREATE INDEX IF NOT EXISTS idx_bookmark_user_paper ON BOOKMARK(user_id, paper_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmark_paper_user ON BOOKMARK(paper_id, user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_date ON SEARCH_HISTORY(user_id, search_date DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_type ON SEARCH_HISTORY(search_type);

CREATE INDEX IF NOT EXISTS idx_citation_citing ON CITATION(citing_paper_id);
CREATE INDEX IF NOT EXISTS idx_citation_cited ON CITATION(cited_paper_id);
CREATE INDEX IF NOT EXISTS idx_citation_composite ON CITATION(citing_paper_id, cited_paper_id);

CREATE INDEX IF NOT EXISTS idx_paper_journal ON RESEARCH_PAPER(journal_id);
CREATE INDEX IF NOT EXISTS idx_paper_conference ON RESEARCH_PAPER(conference_id);
CREATE INDEX IF NOT EXISTS idx_paper_source_type ON RESEARCH_PAPER(source_type);

-- -------------------------------------------------------------------------
-- 3. GIN INDEX FOR POSTGRESQL FULL-TEXT SEARCH (FTS)
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_research_paper_fts ON RESEARCH_PAPER 
USING GIN (to_tsvector('english', title || ' ' || abstract));

-- -------------------------------------------------------------------------
-- 4. HNSW / VECTOR INDEX FOR SEMANTIC SEARCH (pgvector)
-- -------------------------------------------------------------------------
-- Note: HNSW cosine distance index for vector similarity search
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        BEGIN
            CREATE INDEX IF NOT EXISTS idx_paper_embeddings_hnsw 
            ON PAPER_EMBEDDINGS USING hnsw (embedding vector_cosine_ops);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'HNSW index creation deferred or unsupported in current vector version: %', SQLERRM;
        END;
    END IF;
END $$;

