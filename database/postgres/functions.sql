-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Functions & Stored Logic (Level-3 DBMS Architecture)
-- =========================================================================

-- -------------------------------------------------------------------------
-- FUNCTION 1: get_papers_by_area
-- Purpose: Retrieves all research papers belonging to a specified research area,
--          including author listings, citation counts, and publication date.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_papers_by_area(p_area_name VARCHAR)
RETURNS TABLE (
    paper_id INTEGER,
    title VARCHAR,
    abstract TEXT,
    doi VARCHAR,
    publication_date DATE,
    citation_count INTEGER,
    source VARCHAR,
    authors TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.paper_id,
        rp.title,
        rp.abstract,
        rp.doi,
        rp.publication_date,
        rp.citation_count,
        rp.source,
        COALESCE(string_agg(a.name, ', ' ORDER BY pa.author_order), 'Unknown Author') AS authors
    FROM RESEARCH_PAPER rp
    JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
    JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
    LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
    LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
    WHERE LOWER(ra.area_name) = LOWER(p_area_name)
    GROUP BY rp.paper_id, rp.title, rp.abstract, rp.doi, rp.publication_date, rp.citation_count, rp.source
    ORDER BY rp.publication_date DESC, rp.citation_count DESC;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- FUNCTION 2: calculate_popular_papers
-- Purpose: Computes top-ranked papers dynamically using a parameterized limit.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_popular_papers(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    paper_id INTEGER,
    title VARCHAR,
    doi VARCHAR,
    citation_count INTEGER,
    bookmark_count BIGINT,
    popularity_score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.paper_id,
        rp.title,
        rp.doi,
        rp.citation_count,
        COUNT(b.user_id) AS bookmark_count,
        (rp.citation_count * 2 + COUNT(b.user_id) * 3)::BIGINT AS popularity_score
    FROM RESEARCH_PAPER rp
    LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
    GROUP BY rp.paper_id, rp.title, rp.doi, rp.citation_count
    ORDER BY popularity_score DESC, rp.citation_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------------------
-- FUNCTION 3: get_citation_stats
-- Purpose: Returns aggregate citation metrics for a paper:
--          - Total cited papers (references out)
--          - Total citing papers (citations in)
--          - Second-degree citations (citations to citing papers)
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_citation_stats(p_paper_id INTEGER)
RETURNS TABLE (
    paper_id INTEGER,
    total_references_cited BIGINT,
    total_citations_received BIGINT,
    second_degree_citations BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH direct_references AS (
        SELECT COUNT(*) AS ref_count
        FROM CITATION
        WHERE citing_paper_id = p_paper_id
    ),
    direct_citations AS (
        SELECT citing_paper_id
        FROM CITATION
        WHERE cited_paper_id = p_paper_id
    ),
    citations_count AS (
        SELECT COUNT(*) AS cit_count FROM direct_citations
    ),
    second_degree AS (
        SELECT COUNT(DISTINCT c2.citing_paper_id) AS second_degree_count
        FROM direct_citations dc
        JOIN CITATION c2 ON dc.citing_paper_id = c2.cited_paper_id
        WHERE c2.citing_paper_id <> p_paper_id
    )
    SELECT 
        p_paper_id,
        dr.ref_count AS total_references_cited,
        cc.cit_count AS total_citations_received,
        sd.second_degree_count AS second_degree_citations
    FROM direct_references dr
    CROSS JOIN citations_count cc
    CROSS JOIN second_degree sd;
END;
$$ LANGUAGE plpgsql;

