import fs from 'fs';
import path from 'path';
import { query, exec } from '../lib/db/postgres';
import { connectMongoDB } from '../lib/db/mongodb';
import PaperDocument from '../database/mongodb/models/PaperDocument';
import { generateEmbedding, formatVectorForPg } from '../semantic/embedding_service/embedder';
import { initDatabases } from './init-db';

interface PaperRow {
  paper_id: number;
  title: string;
  abstract: string;
  doi: string;
  publication_date: string;
  source: string;
}

// Keyword generator per domain/title
function deriveKeywords(title: string, abstract: string): string[] {
  const combined = (title + ' ' + abstract).toLowerCase();
  const keywordMap: { [key: string]: string[] } = {
    transformer: ['transformers', 'self-attention', 'deep learning', 'nlp'],
    resnet: ['deep residual learning', 'convolutional networks', 'computer vision', 'imagenet'],
    bert: ['bidirectional encoder', 'language representation', 'pre-training', 'nlp'],
    gan: ['generative adversarial networks', 'minimax game', 'generative modeling', 'deep learning'],
    pagerank: ['hypertext search', 'web crawling', 'link analysis', 'information retrieval'],
    spanner: ['distributed transactions', 'truetime', 'multiversion concurrency', 'cloud database'],
    mapreduce: ['distributed computing', 'parallel processing', 'cluster computing', 'data analytics'],
    spark: ['in-memory computing', 'resilient distributed datasets', 'fault tolerance', 'big data'],
    privacy: ['differential privacy', 'stochastic gradient descent', 'data privacy', 'machine learning security'],
    intrusion: ['network intrusion detection', 'packet inspection', 'cybersecurity', 'deep neural networks'],
    cloud: ['cloud resource allocation', 'reinforcement learning', 'multi-tenancy', 'datacenter energy'],
    vector: ['approximate nearest neighbors', 'vector database', 'hnsw', 'semantic search'],
    graph: ['graph neural networks', 'semi-supervised learning', 'node classification', 'spectral graph theory'],
    quantum: ['quantum algorithms', 'quantum chemistry', 'molecular simulation', 'qubit control'],
    contrastive: ['contrastive learning', 'self-supervised learning', 'visual representations', 'representation learning'],
    rag: ['retrieval augmented generation', 'dense retrieval', 'knowledge intensive nlp', 'hallucination reduction'],
    llama: ['open foundation models', 'autoregressive language models', 'open source llm', 'scaling laws'],
    mvcc: ['postgresql', 'multi-version concurrency control', 'wal', 'database transactions'],
    benchmark: ['nosql vs relational', 'document store', 'mongodb', 'acid transactions'],
    hybrid: ['hybrid search', 'reciprocal rank fusion', 'bm25', 'dense vectors'],
    diffusion: ['diffusion models', 'denoising score matching', 'image synthesis', 'generative ai'],
    poisoning: ['adversarial attacks', 'data poisoning', 'machine learning security', 'spectral signatures'],
    crispr: ['crispr cas9', 'guide rna', 'genome editing', 'transformer sequence modeling'],
    serverless: ['serverless computing', 'faas', 'cold start latency', 'cloud infrastructure'],
    paxos: ['paxos consensus', 'state machine replication', 'fault tolerance', 'distributed systems'],
    'c-store': ['column-oriented dbms', 'olap', 'data compression', 'analytical database'],
    biomedical: ['biomedical image segmentation', 'self-supervised pretraining', 'ct mri analysis', 'medical ai'],
    recsys: ['semantic recommendations', 'citation graphs', 'academic discovery', 'collaborative filtering'],
    supremacy: ['quantum supremacy', 'superconducting qubits', 'quantum circuit sampling', 'quantum computing'],
    threat: ['threat hunting', 'multi-agent reinforcement learning', 'apt detection', 'cyber defense'],
  };

  const matched = new Set<string>();
  for (const [key, tags] of Object.entries(keywordMap)) {
    if (combined.includes(key)) {
      tags.forEach((t) => matched.add(t));
    }
  }

  if (matched.size === 0) {
    matched.add('computer science');
    matched.add('academic research');
    matched.add('database systems');
  }

  return Array.from(matched).slice(0, 6);
}

export async function seedAll() {
  console.log('========================================================');
  console.log('STARTING SEEDING PIPELINE (PostgreSQL, MongoDB, pgvector)');
  console.log('========================================================');

  // Step 1: Initialize database schemas
  await initDatabases();

  // Step 2: Populate PostgreSQL Relational Tables
  console.log('[PostgreSQL] Executing seed.sql...');
  const seedSql = fs.readFileSync(path.resolve(process.cwd(), 'database/postgres/seed.sql'), 'utf8');
  await exec(seedSql);
  console.log('[PostgreSQL] Successfully seeded relational entities (Users, Authors, Papers, Areas, Citations, Bookmarks, History).');

  // Step 3: Fetch all research papers for Vector & Document processing
  const res = await query<PaperRow>('SELECT paper_id, title, abstract, doi, publication_date, source FROM RESEARCH_PAPER ORDER BY paper_id ASC;');
  const papers = res.rows;
  console.log(`[Processing] Retrieved ${papers.length} papers for pgvector embeddings and MongoDB documents.`);

  // Step 4: Connect to MongoDB
  await connectMongoDB();
  console.log('[MongoDB] Connected. Clearing previous paper_documents collection...');
  await PaperDocument.deleteMany({});

  // Step 5: Generate Dense Vector Embeddings and MongoDB Documents
  console.log('[Embeddings & Mongo] Processing semantic vectors and unstructured documents...');
  for (const paper of papers) {
    const textToEmbed = `${paper.title}. ${paper.abstract}`;
    
    // Generate real 384-dimensional dense vector
    const embedding = await generateEmbedding(textToEmbed);
    const pgVectorStr = formatVectorForPg(embedding);

    // Upsert into PostgreSQL PAPER_EMBEDDINGS
    await query(
      `INSERT INTO PAPER_EMBEDDINGS (paper_id, embedding, embedding_model, created_at)
       VALUES ($1, $2, 'all-MiniLM-L6-v2', CURRENT_TIMESTAMP)
       ON CONFLICT (paper_id) 
       DO UPDATE SET embedding = EXCLUDED.embedding, created_at = CURRENT_TIMESTAMP;`,
      [paper.paper_id, pgVectorStr]
    );

    // Construct structured MongoDB Document
    const keywords = deriveKeywords(paper.title, paper.abstract);
    const pubYear = new Date(paper.publication_date).getFullYear();

    const sections = [
      {
        heading: 'Introduction',
        content: `In this investigation, we examine the fundamental principles underpinning ${paper.title.toLowerCase()}. As modern computing architectures scale to unprecedented capacities, resolving core bottlenecks in computational latency, representation efficiency, and structural generalization is essential.`,
      },
      {
        heading: 'Methodology & Theoretical Framework',
        content: `Our proposed methodology formulates an empirical framework evaluated over rigorous benchmark datasets. Specifically, ${paper.abstract} We establish formal mathematical boundaries, analyze convergence criteria, and enforce robust invariant validation throughout iterative executions.`,
      },
      {
        heading: 'Experimental Results & Discussion',
        content: `Empirical evaluations reveal that our formulation achieves significant gains over baseline architectures. Comparative evaluations demonstrate superior robustness, faster training and inference convergence, and marked reduction in resource overhead under peak operational concurrency.`,
      },
      {
        heading: 'Conclusion & Future Horizons',
        content: `This paper has presented a comprehensive treatment of the topic. Future extensions will investigate multi-modal adaptation, decentralized consensus integration, and edge-device acceleration for resource-constrained deployments.`,
      },
    ];

    const references = [
      {
        title: 'Attention Is All You Need',
        authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
        year: 2017,
        doi: '10.1145/transformer.2017.001',
      },
      {
        title: 'Deep Residual Learning for Image Recognition',
        authors: ['He, K.', 'Zhang, X.', 'Ren, S.', 'Sun, J.'],
        year: 2016,
        doi: '10.1109/cvpr.2016.90',
      },
      {
        title: 'Spanner: Google Globally-Distributed Database System',
        authors: ['Corbett, J. C.', 'Dean, J.', 'Epstein, M.'],
        year: 2012,
        doi: '10.1145/2387880.2387882',
      },
      {
        title: 'Vector Database Indexing with HNSW Graphs',
        authors: ['Malkov, Y. A.', 'Yashunin, D. A.'],
        year: 2020,
        doi: '10.1145/sigmod.2023.109',
      },
    ];

    const fullText = `${paper.title}\n\nABSTRACT:\n${paper.abstract}\n\n1. INTRODUCTION\n${sections[0].content}\n\n2. METHODOLOGY\n${sections[1].content}\n\n3. RESULTS\n${sections[2].content}\n\n4. CONCLUSION\n${sections[3].content}`;

    await PaperDocument.create({
      paper_id: paper.paper_id,
      full_text: fullText,
      sections,
      references,
      keywords,
      metadata: {
        language: 'English',
        document_type: 'Research Article',
        publisher: paper.source,
        page_count: Math.floor(Math.random() * 8) + 8,
        peer_reviewed: true,
      },
    });

    console.log(`  [Synced Paper #${paper.paper_id}] Vector (384-dim) & Mongo Document created: "${paper.title.substring(0, 40)}..."`);
  }

  // Step 6: Verify cross-database synchronization counts
  const pgCountRes = await query('SELECT COUNT(*) AS count FROM RESEARCH_PAPER;');
  const pgEmbedCountRes = await query('SELECT COUNT(*) AS count FROM PAPER_EMBEDDINGS;');
  const mongoCount = await PaperDocument.countDocuments();

  console.log('========================================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY');
  console.log(`- PostgreSQL Papers: ${pgCountRes.rows[0].count}`);
  console.log(`- PostgreSQL Embeddings: ${pgEmbedCountRes.rows[0].count}`);
  console.log(`- MongoDB Paper Documents: ${mongoCount}`);
  console.log('========================================================');
}

if (require.main === module) {
  seedAll()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

