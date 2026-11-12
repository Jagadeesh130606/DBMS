export interface DbmsQueryDemo {
  id: string;
  category: string;
  title: string;
  concept: string;
  sql: string;
  description: string;
}

export const DBMS_DEMO_QUERIES: DbmsQueryDemo[] = [
  {
    id: 'select_basic',
    category: '1. Basic Projections',
    title: 'Basic SELECT Projections',
    concept: 'SELECT projection with column renaming and row limit',
    description: 'Retrieves research paper metadata including paper ID, title, DOI, and publication dates.',
    sql: `SELECT paper_id, title, doi, publication_date, source 
FROM RESEARCH_PAPER 
ORDER BY publication_date DESC 
LIMIT 10;`,
  },
  {
    id: 'where_filtering',
    category: '2. Filtering & Predicates',
    title: 'WHERE Predicate Filtering',
    concept: 'Boolean predicates with compound condition and pattern matching',
    description: 'Filters papers published since 2020 with more than 20 citations matching learning keywords.',
    sql: `SELECT paper_id, title, publication_date, citation_count, source 
FROM RESEARCH_PAPER 
WHERE publication_date >= '2020-01-01' 
  AND citation_count >= 20 
  AND LOWER(title) LIKE '%learning%'
ORDER BY citation_count DESC;`,
  },
  {
    id: 'order_by_multi',
    category: '3. Sorting & Ordering',
    title: 'Multi-Column ORDER BY',
    concept: 'Ascending and descending composite sorting',
    description: 'Sorts papers primarily by impact (citation count descending) and secondarily by publication recency.',
    sql: `SELECT paper_id, title, citation_count, publication_date, source 
FROM RESEARCH_PAPER 
ORDER BY citation_count DESC, publication_date DESC 
LIMIT 15;`,
  },
  {
    id: 'group_by_sources',
    category: '4. Grouping',
    title: 'GROUP BY with Aggregation',
    concept: 'Tuple partitioning by categorical attributes',
    description: 'Groups papers by academic publication venue/source, computing total publications and average citations.',
    sql: `SELECT 
    source, 
    COUNT(*) AS total_papers, 
    SUM(citation_count) AS aggregate_citations,
    ROUND(AVG(citation_count), 2) AS avg_citations
FROM RESEARCH_PAPER 
GROUP BY source 
ORDER BY total_papers DESC, aggregate_citations DESC;`,
  },
  {
    id: 'having_clause',
    category: '5. Group Filtering',
    title: 'HAVING Aggregate Filter',
    concept: 'Post-aggregation predicate filtering using HAVING',
    description: 'Identifies high-impact research areas that contain multiple papers with total citations exceeding 50.',
    sql: `SELECT 
    ra.area_name, 
    COUNT(par.paper_id) AS paper_count, 
    SUM(rp.citation_count) AS total_citations
FROM RESEARCH_AREA ra
JOIN PAPER_AREA par ON ra.area_id = par.area_id
JOIN RESEARCH_PAPER rp ON par.paper_id = rp.paper_id
GROUP BY ra.area_name
HAVING COUNT(par.paper_id) >= 2 AND SUM(rp.citation_count) > 50
ORDER BY total_citations DESC;`,
  },
  {
    id: 'inner_join',
    category: '6. Joins',
    title: 'INNER JOIN (Papers & Authors)',
    concept: 'Equi-join matching primary and foreign key constraints',
    description: 'Retrieves papers with their exact assigned authors and author sequence order.',
    sql: `SELECT 
    rp.paper_id, 
    rp.title, 
    a.name AS author_name, 
    a.affiliation, 
    pa.author_order
FROM RESEARCH_PAPER rp
INNER JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
INNER JOIN AUTHORS a ON pa.author_id = a.author_id
WHERE pa.author_order = 1
ORDER BY rp.paper_id ASC 
LIMIT 10;`,
  },
  {
    id: 'join_journal_er',
    category: '6. Joins (ER Diagram)',
    title: 'INNER JOIN (Papers Published in Journals)',
    concept: 'M:1 Relationship PUBLISHED_IN from ER Diagram',
    description: 'Retrieves research papers published in academic journals with publisher and ISSN validation.',
    sql: `SELECT 
    rp.paper_id,
    rp.title,
    rp.doi,
    j.journal_name,
    j.publisher,
    j.issn
FROM RESEARCH_PAPER rp
INNER JOIN JOURNAL j ON rp.journal_id = j.journal_id
ORDER BY rp.paper_id ASC
LIMIT 10;`,
  },
  {
    id: 'join_conference_er',
    category: '6. Joins (ER Diagram)',
    title: 'INNER JOIN (Papers Presented in Conferences)',
    concept: 'M:1 Relationship PRESENTED_IN from ER Diagram',
    description: 'Retrieves research papers presented in international conferences with venue locations and edition years.',
    sql: `SELECT 
    rp.paper_id,
    rp.title,
    rp.doi,
    c.conference_name,
    c.location,
    c.year
FROM RESEARCH_PAPER rp
INNER JOIN CONFERENCE c ON rp.conference_id = c.conference_id
ORDER BY rp.paper_id ASC
LIMIT 10;`,
  },
  {
    id: 'left_join',
    category: '7. Outer Joins',
    title: 'LEFT OUTER JOIN (Users & Bookmarks)',
    concept: 'Preserves all left tuples regardless of right-table match',
    description: 'Lists all registered users along with any research papers they bookmarked, including users with zero bookmarks.',
    sql: `SELECT 
    u.user_id, 
    u.name AS user_name, 
    u.role, 
    b.paper_id AS bookmarked_paper_id,
    rp.title AS bookmarked_paper_title
FROM USERS u
LEFT JOIN BOOKMARK b ON u.user_id = b.user_id
LEFT JOIN RESEARCH_PAPER rp ON b.paper_id = rp.paper_id
ORDER BY u.user_id ASC 
LIMIT 15;`,
  },
  {
    id: 'right_join',
    category: '8. Outer Joins',
    title: 'RIGHT OUTER JOIN (Research Areas)',
    concept: 'Right outer preservation of taxonomical categories',
    description: 'Preserves all research areas, mapping them to associated papers to verify domain coverage.',
    sql: `SELECT 
    par.paper_id, 
    rp.title, 
    ra.area_id, 
    ra.area_name
FROM PAPER_AREA par
JOIN RESEARCH_PAPER rp ON par.paper_id = rp.paper_id
RIGHT JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
ORDER BY ra.area_id ASC;`,
  },
  {
    id: 'multi_join',
    category: '9. Multi-Table Joins',
    title: 'Complex Multi-Table JOIN (5 Entities)',
    concept: '5-table relational join connecting paper, authors, areas, and bookmarks',
    description: 'Synthesizes complete academic catalog tuples across USERS, BOOKMARKS, PAPERS, AUTHORS, and AREAS.',
    sql: `SELECT 
    rp.paper_id,
    rp.title,
    a.name AS author_name,
    ra.area_name,
    COUNT(DISTINCT b.user_id) AS total_bookmarks
FROM RESEARCH_PAPER rp
JOIN PAPER_AUTHOR pa ON rp.paper_id = pa.paper_id
JOIN AUTHORS a ON pa.author_id = a.author_id
JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
LEFT JOIN BOOKMARK b ON rp.paper_id = b.paper_id
WHERE pa.author_order = 1
GROUP BY rp.paper_id, rp.title, a.name, ra.area_name
ORDER BY rp.paper_id ASC
LIMIT 12;`,
  },
  {
    id: 'aggregate_functions',
    category: '10. Aggregate Functions',
    title: 'Standard Statistical Aggregates',
    concept: 'COUNT, SUM, AVG, MIN, MAX statistical metrics',
    description: 'Calculates global corpus statistics across research papers.',
    sql: `SELECT 
    COUNT(*) AS total_papers,
    SUM(citation_count) AS total_citations_in_corpus,
    ROUND(AVG(citation_count), 2) AS average_citations_per_paper,
    MIN(citation_count) AS minimum_citations,
    MAX(citation_count) AS maximum_citations,
    MIN(publication_date) AS earliest_publication_date,
    MAX(publication_date) AS latest_publication_date
FROM RESEARCH_PAPER;`,
  },
  {
    id: 'nested_subquery',
    category: '11. Subqueries',
    title: 'Nested Scalar Subquery in WHERE',
    concept: 'Predicate evaluation against an inner scalar query result',
    description: 'Finds papers whose citation count is strictly above the average citation count of the entire repository.',
    sql: `SELECT paper_id, title, citation_count, source 
FROM RESEARCH_PAPER 
WHERE citation_count > (
    SELECT AVG(citation_count) FROM RESEARCH_PAPER
)
ORDER BY citation_count DESC;`,
  },
  {
    id: 'correlated_subquery',
    category: '12. Correlated Subqueries',
    title: 'Correlated Subquery',
    concept: 'Inner query referencing outer tuple attributes per row',
    description: 'Retrieves papers that have more citations than the average citation count within their specific research area.',
    sql: `SELECT 
    rp1.paper_id, 
    rp1.title, 
    rp1.citation_count,
    ra1.area_name
FROM RESEARCH_PAPER rp1
JOIN PAPER_AREA par1 ON rp1.paper_id = par1.paper_id
JOIN RESEARCH_AREA ra1 ON par1.area_id = ra1.area_id
WHERE rp1.citation_count >= (
    SELECT AVG(rp2.citation_count)
    FROM RESEARCH_PAPER rp2
    JOIN PAPER_AREA par2 ON rp2.paper_id = par2.paper_id
    WHERE par2.area_id = par1.area_id
)
ORDER BY ra1.area_name, rp1.citation_count DESC;`,
  },
  {
    id: 'exists_not_exists',
    category: '13. Set Membership',
    title: 'EXISTS and NOT EXISTS',
    concept: 'Semi-join and anti-join existence predicates',
    description: 'Demonstrates EXISTS to identify active authors and NOT EXISTS to find authors with zero citations received.',
    sql: `SELECT a.author_id, a.name, a.affiliation 
FROM AUTHORS a
WHERE EXISTS (
    SELECT 1 
    FROM PAPER_AUTHOR pa
    JOIN CITATION c ON pa.paper_id = c.cited_paper_id
    WHERE pa.author_id = a.author_id
)
ORDER BY a.name ASC;`,
  },
  {
    id: 'union_sets',
    category: '14. Set Operations',
    title: 'UNION Set Operation',
    concept: 'Union of distinct query result sets',
    description: 'Unifies titles of highly-cited landmark papers with titles of papers actively bookmarked by students.',
    sql: `SELECT rp.paper_id, rp.title, 'High Citation Landmark' AS classification
FROM RESEARCH_PAPER rp
WHERE rp.citation_count >= 40

UNION

SELECT rp.paper_id, rp.title, 'Student Bookmarked Paper' AS classification
FROM RESEARCH_PAPER rp
JOIN BOOKMARK b ON rp.paper_id = b.paper_id
JOIN USERS u ON b.user_id = u.user_id
WHERE u.role = 'STUDENT'
ORDER BY paper_id ASC;`,
  },
  {
    id: 'cte_basic',
    category: '15. Common Table Expressions',
    title: 'Common Table Expression (WITH CTE)',
    concept: 'Modular query factoring using named CTE subqueries',
    description: 'Factors author metrics and area metrics into CTEs to build a normalized researcher index.',
    sql: `WITH AuthorStats AS (
    SELECT 
        pa.author_id, 
        COUNT(DISTINCT pa.paper_id) AS pub_count,
        SUM(rp.citation_count) AS total_cites
    FROM PAPER_AUTHOR pa
    JOIN RESEARCH_PAPER rp ON pa.paper_id = rp.paper_id
    GROUP BY pa.author_id
),
TopAreas AS (
    SELECT 
        par.area_id, 
        COUNT(*) AS area_papers
    FROM PAPER_AREA par
    GROUP BY par.area_id
    HAVING COUNT(*) >= 3
)
SELECT 
    a.name, 
    a.affiliation, 
    astat.pub_count, 
    astat.total_cites
FROM AUTHORS a
JOIN AuthorStats astat ON a.author_id = astat.author_id
WHERE astat.pub_count >= 2
ORDER BY astat.total_cites DESC;`,
  },
  {
    id: 'recursive_cte',
    category: '16. Recursive CTEs',
    title: 'Recursive CTE: Citation Graph Traversal',
    concept: 'Recursive multi-hop graph exploration with cycle avoidance',
    description: 'Explores transitive citation chains starting from "Attention Is All You Need" (Paper #1) up to 3 degrees of separation.',
    sql: `WITH RECURSIVE CitationChain AS (
    -- Anchor Member: papers directly citing Paper #1
    SELECT 
        c.citing_paper_id,
        c.cited_paper_id,
        1 AS citation_hop,
        ARRAY[c.cited_paper_id, c.citing_paper_id] AS traversal_path
    FROM CITATION c
    WHERE c.cited_paper_id = 1

    UNION ALL

    -- Recursive Member: papers citing the citing papers
    SELECT 
        c_next.citing_paper_id,
        c_next.cited_paper_id,
        cc.citation_hop + 1,
        cc.traversal_path || c_next.citing_paper_id
    FROM CITATION c_next
    JOIN CitationChain cc ON c_next.cited_paper_id = cc.citing_paper_id
    WHERE cc.citation_hop < 3
      AND NOT (c_next.citing_paper_id = ANY(cc.traversal_path))
)
SELECT 
    cc.citation_hop,
    rp_from.paper_id AS citing_id,
    rp_from.title AS citing_paper,
    rp_to.paper_id AS cited_id,
    rp_to.title AS cited_paper
FROM CitationChain cc
JOIN RESEARCH_PAPER rp_from ON cc.citing_paper_id = rp_from.paper_id
JOIN RESEARCH_PAPER rp_to ON cc.cited_paper_id = rp_to.paper_id
ORDER BY cc.citation_hop ASC, citing_id ASC
LIMIT 20;`,
  },
  {
    id: 'window_functions',
    category: '17. Window Functions',
    title: 'Window Functions (DENSE_RANK & PARTITION BY)',
    concept: 'Analytical partitioning, ranking, and cumulative sums',
    description: 'Ranks papers within each research area by citations using DENSE_RANK() OVER (PARTITION BY ...).',
    sql: `SELECT 
    ra.area_name,
    rp.paper_id,
    rp.title,
    rp.citation_count,
    DENSE_RANK() OVER (
        PARTITION BY ra.area_id 
        ORDER BY rp.citation_count DESC
    ) AS rank_in_domain,
    ROUND(AVG(rp.citation_count) OVER (PARTITION BY ra.area_id), 1) AS domain_avg_citations
FROM RESEARCH_PAPER rp
JOIN PAPER_AREA par ON rp.paper_id = par.paper_id
JOIN RESEARCH_AREA ra ON par.area_id = ra.area_id
ORDER BY ra.area_name ASC, rank_in_domain ASC;`,
  },
  {
    id: 'acid_transaction',
    category: '18. Transactions & DML',
    title: 'DML with Atomic Isolation Test',
    concept: 'INSERT, UPDATE, and rollback safety',
    description: 'Demonstrates reading state before and after parameter updates with transactional consistency.',
    sql: `SELECT 
    rp.paper_id,
    rp.title,
    rp.citation_count,
    (SELECT COUNT(*) FROM CITATION c WHERE c.cited_paper_id = rp.paper_id) AS computed_citations
FROM RESEARCH_PAPER rp
ORDER BY rp.citation_count DESC
LIMIT 10;`,
  },
];

