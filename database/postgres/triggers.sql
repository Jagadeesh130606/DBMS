-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Database Triggers (Level-3 DBMS Architecture)
-- =========================================================================

-- -------------------------------------------------------------------------
-- TRIGGER 1: Prevent Self Citation
-- Purpose: Enforces integrity rule preventing a research paper from citing itself.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_prevent_self_citation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.citing_paper_id = NEW.cited_paper_id THEN
        RAISE EXCEPTION 'Database Constraint Violation: Paper % cannot cite itself.', NEW.citing_paper_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_self_citation ON CITATION;
CREATE TRIGGER trg_prevent_self_citation
BEFORE INSERT OR UPDATE ON CITATION
FOR EACH ROW
EXECUTE FUNCTION fn_prevent_self_citation();

-- -------------------------------------------------------------------------
-- TRIGGER 2: Increment Citation Count on Citation Insert
-- Purpose: Automatically updates RESEARCH_PAPER.citation_count whenever a
--          new citation edge is inserted into the CITATION graph.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_increment_citation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE RESEARCH_PAPER
    SET citation_count = citation_count + 1
    WHERE paper_id = NEW.cited_paper_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_citation_count ON CITATION;
CREATE TRIGGER trg_increment_citation_count
AFTER INSERT ON CITATION
FOR EACH ROW
EXECUTE FUNCTION fn_increment_citation_count();

-- -------------------------------------------------------------------------
-- TRIGGER 3: Decrement Citation Count on Citation Delete
-- Purpose: Automatically decrements RESEARCH_PAPER.citation_count whenever a
--          citation edge is removed from the CITATION graph.
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_decrement_citation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE RESEARCH_PAPER
    SET citation_count = GREATEST(citation_count - 1, 0)
    WHERE paper_id = OLD.cited_paper_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_decrement_citation_count ON CITATION;
CREATE TRIGGER trg_decrement_citation_count
AFTER DELETE ON CITATION
FOR EACH ROW
EXECUTE FUNCTION fn_decrement_citation_count();

