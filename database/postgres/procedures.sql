-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Stored Procedures (Level-3 DBMS Architecture)
-- =========================================================================

-- -------------------------------------------------------------------------
-- PROCEDURE 1: add_research_paper_tx
-- Purpose: Atomically registers a research paper, attaches primary author
--          association, and assigns it to a research area within a single
--          transaction boundary to preserve referential integrity.
-- -------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE add_research_paper_tx(
    IN p_title VARCHAR,
    IN p_abstract TEXT,
    IN p_doi VARCHAR,
    IN p_pub_date DATE,
    IN p_source VARCHAR,
    IN p_author_id INTEGER,
    IN p_area_id INTEGER,
    INOUT p_new_paper_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Insert core Research Paper record
    INSERT INTO RESEARCH_PAPER (title, abstract, doi, publication_date, citation_count, source)
    VALUES (p_title, p_abstract, p_doi, p_pub_date, 0, p_source)
    RETURNING paper_id INTO p_new_paper_id;

    -- 2. Link author with author_order = 1
    IF p_author_id IS NOT NULL THEN
        INSERT INTO PAPER_AUTHOR (paper_id, author_id, author_order)
        VALUES (p_new_paper_id, p_author_id, 1);
    END IF;

    -- 3. Categorize paper into research area
    IF p_area_id IS NOT NULL THEN
        INSERT INTO PAPER_AREA (paper_id, area_id)
        VALUES (p_new_paper_id, p_area_id);
    END IF;
    
    RAISE NOTICE 'Successfully committed new research paper ID: %', p_new_paper_id;
END;
$$;

