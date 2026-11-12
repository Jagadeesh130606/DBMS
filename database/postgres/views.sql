-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Database Views (Level-3 DBMS Architecture)
-- =========================================================================

-- -------------------------------------------------------------------------
-- VIEW 1: paper_details_view
-- Purpose: Unified denormalized view combining Research Paper with aggregated
--          ordered authors and research areas for efficient catalog queries.
-- -------------------------------------------------------------------------
DROP VIEW IF EXISTS paper_details_view;
CREATE VIEW paper_details_view AS
SELECT 
    rp.paper_id,
    rp.title,
    rp.abstract,
    rp.doi,
    rp.publication_date,
    rp.citation_count,
    rp.source,
    rp.source_type,
    rp.journal_id,
    rp.conference_id,
    j.journal_name,
    c.conference_name,
    rp.created_at,
    COALESCE(
        string_agg(DISTINCT a.name, ', ' ORDER BY a.name),
        'Unknown Author'
    ) AS authors,
    COALESCE(
        string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name),
        'General Science'
    ) AS research_areas,
    COUNT(DISTINCT b.user_id) AS bookmark_count
FROM RESEARCH_PAPER rp
LEFT JOIN JOURNAL j ON rp.journal_id = j.journal_id
LEFT JOIN CONFERENCE c ON rp.conference_id = c.conference_id
LEFT JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
LEFT JOIN AUTHORS a ON pa.author_id = a.author_id
LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
GROUP BY 
    rp.paper_id, 
    rp.title, 
    rp.abstract, 
    rp.doi, 
    rp.publication_date, 
    rp.citation_count, 
    rp.source, 
    rp.source_type,
    rp.journal_id,
    rp.conference_id,
    j.journal_name,
    c.conference_name,
    rp.created_at;

-- -------------------------------------------------------------------------
-- VIEW 2: popular_papers_view
-- Purpose: Ranks papers using an impact metric calculated from citation counts
--          and user bookmarks (Weighted Popularity Index).
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW popular_papers_view AS
SELECT 
    rp.paper_id,
    rp.title,
    rp.doi,
    rp.source,
    rp.publication_date,
    rp.citation_count,
    COUNT(DISTINCT b.user_id) AS total_bookmarks,
    (rp.citation_count * 2 + COUNT(DISTINCT b.user_id) * 3) AS popularity_score,
    DENSE_RANK() OVER (
        ORDER BY (rp.citation_count * 2 + COUNT(DISTINCT b.user_id) * 3) DESC, rp.publication_date DESC
    ) AS popularity_rank
FROM RESEARCH_PAPER rp
LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
GROUP BY 
    rp.paper_id, 
    rp.title, 
    rp.doi, 
    rp.source, 
    rp.publication_date, 
    rp.citation_count;

-- -------------------------------------------------------------------------
-- VIEW 3: author_publication_view
-- Purpose: Author productivity metrics: publication count, aggregate citations,
--          average citations per paper, and distinct research domains.
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW author_publication_view AS
SELECT 
    a.author_id,
    a.name AS author_name,
    a.affiliation,
    a.email,
    COUNT(DISTINCT pa.paper_id) AS total_publications,
    COALESCE(SUM(rp.citation_count), 0) AS total_citations,
    ROUND(COALESCE(AVG(rp.citation_count), 0), 2) AS avg_citations_per_paper,
    COALESCE(
        string_agg(DISTINCT ra.area_name, ', ' ORDER BY ra.area_name), 
        'Interdisciplinary'
    ) AS primary_research_areas
FROM AUTHORS a
LEFT JOIN PAPER_AUTHOR pa ON a.author_id = pa.author_id
LEFT JOIN RESEARCH_PAPER rp ON pa.paper_id = rp.paper_id
LEFT JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
LEFT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
GROUP BY 
    a.author_id, 
    a.name, 
    a.affiliation, 
    a.email;

-- -------------------------------------------------------------------------
-- VIEW 4: user_bookmark_view
-- Purpose: Rapid retrieval of user-curated libraries with paper details,
--          first author, and timestamp of bookmark creation.
-- -------------------------------------------------------------------------
CREATE OR REPLACE VIEW user_bookmark_view AS
SELECT 
    b.user_id,
    u.name AS user_name,
    u.email AS user_email,
    b.paper_id,
    rp.title,
    rp.doi,
    rp.publication_date,
    rp.source,
    rp.citation_count,
    b.created_at AS bookmarked_at,
    (
        SELECT a.name 
        FROM PAPER_AUTHOR pa
        JOIN AUTHORS a ON pa.author_id = a.author_id
        WHERE pa.paper_id = rp.paper_id
        ORDER BY pa.author_order ASC
        LIMIT 1
    ) AS primary_author
FROM BOOKMARK b
JOIN USERS u ON b.user_id = u.user_id
JOIN RESEARCH_PAPER rp ON b.paper_id = rp.paper_id;

