-- =========================================================================
-- DATABASE: RESEARCH PAPER DISCOVERY & SEMANTIC RECOMMENDATION SYSTEM
-- PostgreSQL Database Seed Data (Level-3 DBMS Architecture)
-- =========================================================================

-- 1. SEED USERS (3 Admins, 7 Students)
-- Password for all accounts is: Password@123
INSERT INTO USERS (user_id, name, email, password_hash, role, created_at) VALUES
(1, 'Dr. Alice Vance', 'admin@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', '2024-01-10 09:00:00Z'),
(2, 'Robert Sterling', 'system.admin@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', '2024-01-12 11:30:00Z'),
(3, 'Prof. David Karger', 'chair.dbms@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', '2024-01-15 14:00:00Z'),
(4, 'Emily Chen', 'student@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-02-01 10:15:00Z'),
(5, 'Alex Miller', 'alex.miller@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-02-05 13:45:00Z'),
(6, 'Sarah Jenkins', 'sarah.jenkins@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-02-10 16:20:00Z'),
(7, 'Raj Patel', 'raj.patel@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-02-15 08:30:00Z'),
(8, 'Maria Garcia', 'maria.garcia@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-02-20 12:00:00Z'),
(9, 'Kenji Sato', 'kenji.sato@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-03-01 15:10:00Z'),
(10, 'Elena Rostova', 'elena.rostova@research.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'STUDENT', '2024-03-05 17:40:00Z')
ON CONFLICT (user_id) DO NOTHING;

-- 2. SEED AUTHORS (15 Prominent Computer Science Researchers)
INSERT INTO AUTHORS (author_id, name, affiliation, email) VALUES
(1, 'Dr. Yoshua Bengio', 'Mila - Quebec AI Institute / Univ. of Montreal', 'yoshua.bengio@mila.quebec'),
(2, 'Dr. Geoffrey Hinton', 'University of Toronto / Vector Institute', 'geoffrey.hinton@utoronto.ca'),
(3, 'Dr. Yann LeCun', 'New York University / Meta FAIR', 'yann.lecun@nyu.edu'),
(4, 'Dr. Christopher D. Manning', 'Stanford University (NLP Group)', 'manning@cs.stanford.edu'),
(5, 'Dr. Fei-Fei Li', 'Stanford University (HAI / Vision Lab)', 'feifeili@stanford.edu'),
(6, 'Dr. Michael Stonebraker', 'MIT CSAIL (Database Group)', 'stonebraker@csail.mit.edu'),
(7, 'Dr. Jennifer Widom', 'Stanford University (School of Engineering)', 'widom@cs.stanford.edu'),
(8, 'Dr. Dawn Song', 'University of California, Berkeley', 'dawnsong@berkeley.edu'),
(9, 'Dr. Leslie Lamport', 'Microsoft Research (Distributed Systems)', 'lamport@microsoft.com'),
(10, 'Dr. Jeffrey Dean', 'Google DeepMind & Research', 'jeff@google.com'),
(11, 'Dr. Matei Zaharia', 'UC Berkeley / Databricks', 'matei@cs.berkeley.edu'),
(12, 'Dr. Peter Shor', 'MIT Department of Mathematics', 'shor@math.mit.edu'),
(13, 'Dr. Aviv Regev', 'Genentech Research & Early Development', 'regev.aviv@gene.com'),
(14, 'Dr. Andrew Ng', 'Stanford University / Landing AI', 'ang@cs.stanford.edu'),
(15, 'Dr. Ion Stoica', 'UC Berkeley (RISELab)', 'istoica@cs.berkeley.edu')
ON CONFLICT (author_id) DO NOTHING;

-- 3. SEED RESEARCH AREAS (8 Academic Domains)
INSERT INTO RESEARCH_AREA (area_id, area_name, description) VALUES
(1, 'Machine Learning & Deep Learning', 'Foundational neural architectures, gradient optimization, generative modeling, and self-supervised paradigms.'),
(2, 'Natural Language Processing & LLMs', 'Transformer architectures, large language models, semantic representation, and question answering systems.'),
(3, 'Computer Vision & Multi-Modal AI', 'Convolutional and visual attention networks, image segmentation, object detection, and cross-modal reasoning.'),
(4, 'Database Systems & Data Engineering', 'Relational query optimization, transaction processing, vector databases, column stores, and NoSQL systems.'),
(5, 'Cybersecurity & Network Defense', 'Intrusion detection, adversarial machine learning, cryptographic protocols, and secure multi-party computation.'),
(6, 'Distributed Systems & Cloud Computing', 'Consensus protocols, large-scale data processing, serverless architectures, and fault-tolerant cluster storage.'),
(7, 'Quantum Computing & Cryptography', 'Quantum algorithms, quantum error correction, post-quantum cryptographic systems, and qubit Hamiltonian simulation.'),
(8, 'Bioinformatics & Computational Biology', 'Genome sequencing algorithms, protein structure prediction, deep learning for molecular biology, and transcriptomics.')
ON CONFLICT (area_id) DO NOTHING;

-- 4. SEED RESEARCH PAPERS (32 Realistic Academic Papers)
INSERT INTO RESEARCH_PAPER (paper_id, title, abstract, doi, publication_date, citation_count, source, created_at) VALUES
(1, 'Attention Is All You Need: Scalable Transformers for Sequence Modeling', 
 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a novel network architecture based solely on self-attention mechanisms, dispensing with recurrence entirely. Experiments show superior translation quality while requiring significantly less training time.', 
 '10.1145/transformer.2017.001', '2017-06-12', 45, 'NeurIPS 2017', '2024-01-15'),

(2, 'Deep Residual Learning for Image Recognition', 
 'Deeper neural networks are notoriously difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate layers as learning residual functions with reference to layer inputs. Our 152-layer ResNet achieves state-of-the-art accuracy on ImageNet.', 
 '10.1109/cvpr.2016.90', '2016-06-27', 52, 'IEEE CVPR 2016', '2024-01-15'),

(3, 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 
 'We introduce BERT, a new language representation model designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. BERT advances state-of-the-art across eleven natural language processing tasks including SQuAD and GLUE benchmark.', 
 '10.18653/v1/n19-1423', '2018-10-11', 38, 'NAACL-HLT 2019', '2024-01-16'),

(4, 'Generative Adversarial Nets and Minimax Game Optimization', 
 'We propose a new framework for estimating generative models via an adversarial process in which we simultaneously train two models: a generative model G that captures data distribution, and a discriminative model D that estimates probability that a sample came from training data rather than G.', 
 '10.1145/gan.2014.04', '2014-06-10', 41, 'NeurIPS 2014', '2024-01-16'),

(5, 'The Anatomy of a Large-Scale Hypertextual Web Search Engine', 
 'In this paper, we present Google, a prototype of a large-scale search engine which makes heavy use of the structure present in hypertext. Google is designed to crawl and index the Web efficiently and produce much more satisfying search results than existing systems using PageRank.', 
 '10.1016/s0169-7552(98)00110-x', '1998-04-14', 60, 'Computer Networks and ISDN Systems', '2024-01-17'),

(6, 'Spanner: Google Globally-Distributed Database System', 
 'Spanner is Google scalable, multi-version, globally-distributed, and synchronously-replicated database. It is the first system to distribute data across the world and support externally-consistent distributed transactions using TrueTime API with hardware synchronized clocks.', 
 '10.1145/2387880.2387882', '2012-10-08', 35, 'USENIX OSDI 2012', '2024-01-17'),

(7, 'MapReduce: Simplified Data Processing on Large Clusters', 
 'MapReduce is a programming model and an associated implementation for processing and generating large data sets. Users specify a map function that processes key/value pairs to generate intermediate pairs, and a reduce function that merges all intermediate values associated with the same key.', 
 '10.1145/1327452.1327492', '2004-12-06', 48, 'Communications of the ACM', '2024-01-18'),

(8, 'Resilient Distributed Datasets: A Fault-Tolerant Abstraction for In-Memory Cluster Computing', 
 'We present Resilient Distributed Datasets (RDDs), a distributed memory abstraction that lets programmers perform in-memory computations on large clusters in a fault-tolerant manner. We implement RDDs in Spark, which outperforms Hadoop by up to 100x in iterative machine learning jobs.', 
 '10.5555/2228298.2228301', '2012-04-10', 42, 'USENIX NSDI 2012', '2024-01-18'),

(9, 'Deep Learning with Differential Privacy and Formal Guarantees', 
 'Machine learning models trained on sensitive data can inadvertently reveal private user inputs. We develop differential privacy techniques for deep learning models trained on stochastic gradient descent (DP-SGD), providing provable privacy protection against membership inference and extraction attacks.', 
 '10.1145/2976749.2978318', '2016-10-24', 28, 'ACM CCS 2016', '2024-01-19'),

(10, 'A Fast and Accurate Deep Network for Network Intrusion Detection', 
 'Modern cyber defense requires low-latency detection of zero-day network attacks. We propose an attention-augmented recurrent deep neural network that evaluates packet header telemetry in real-time. Benchmark evaluations on CIC-IDS2017 show 99.4% precision with microsecond inference times.', 
 '10.1109/tifs.2020.298124', '2020-03-15', 24, 'IEEE Transactions on Information Forensics and Security', '2024-01-19'),

(11, 'Multi-Tenant Cloud Resource Allocation via Deep Reinforcement Learning', 
 'Elastic resource management in multi-tenant cloud data centers faces unpredictable workloads. We present an adaptive actor-critic reinforcement learning controller that minimizes service level objective violations while slashing idle server energy consumption by 34%.', 
 '10.1109/tcc.2021.309481', '2021-07-22', 19, 'IEEE Transactions on Cloud Computing', '2024-01-20'),

(12, 'Vector Database Indexing: High-Dimensional Approximate Nearest Neighbor Search with HNSW', 
 'Vector databases power modern semantic retrieval and generative AI. We investigate Hierarchical Navigable Small World (HNSW) graphs and Inverted File Flat (IVFFlat) indexes over dense embedding spaces, demonstrating sub-millisecond top-k recall trade-offs across millions of 384-dimensional vectors.', 
 '10.1145/sigmod.2023.109', '2023-06-18', 22, 'ACM SIGMOD 2023', '2024-01-20'),

(13, 'Graph Convolutional Networks for Semi-Supervised Node Classification', 
 'We present a scalable approach for semi-supervised learning on graph-structured data based on an efficient layer-wise propagation rule that is motivated by a first-order approximation of spectral convolutions on graphs. Our model scales linearly in graph edges and achieves superior node classification.', 
 '10.48550/arxiv.1609.02907', '2017-02-20', 31, 'ICLR 2017', '2024-01-21'),

(14, 'Zero-Knowledge Proofs for Verifiable Distributed Database Query Execution', 
 'Outsourcing relational database queries to untrusted cloud nodes risks unauthorized data tampering. We construct a zk-SNARK protocol that proves the correctness of relational algebra operations (SELECT, JOIN, GROUP BY) without leaking secret record attributes.', 
 '10.1109/sp.2022.98336', '2022-05-23', 17, 'IEEE Symposium on Security and Privacy (S&P)', '2024-01-21'),

(15, 'Quantum Algorithms for Quantum Chemistry and Molecular Dynamics', 
 'Simulating many-body quantum systems on classical computers scales exponentially. We analyze polynomial-time quantum phase estimation and variational quantum eigensolver (VQE) algorithms implemented on near-term noisy intermediate-scale quantum (NISQ) hardware for nitrogenase catalyst design.', 
 '10.1103/revmodphys.92.015003', '2020-01-14', 21, 'Reviews of Modern Physics', '2024-01-22'),

(16, 'Contrastive Learning of Visual Representations with Normalized Cross Entropy', 
 'We introduce SimCLR: a simple framework for contrastive learning of visual representations without specialized architectures or memory banks. We show that composition of data augmentations and a learnable nonlinear transformation substantially improve representation quality.', 
 '10.5555/3524938.3525140', '2020-07-13', 29, 'ICML 2020', '2024-01-22'),

(17, 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 
 'Large pre-trained language models store factual knowledge in parameter weights, but struggle with factual precision and hallucination. We present RAG models that combine pre-trained parametric memory with non-parametric dense vector index retrieval over Wikipedia articles.', 
 '10.1145/rag.2020.104', '2020-12-06', 36, 'NeurIPS 2020', '2024-01-23'),

(18, 'Llama: Open and Efficient Foundation Language Models', 
 'We present LLaMA, a collection of foundation language models ranging from 7B to 65B parameters. We show that it is possible to train state-of-the-art models using publicly available datasets exclusively, without relying on proprietary or inaccessible data sources.', 
 '10.48550/arxiv.2302.13971', '2023-02-27', 33, 'arXiv Computer Science', '2024-01-23'),

(19, 'PostgreSQL Under the Hood: High-Throughput Concurrency and Transaction Management', 
 'PostgreSQL employs Multi-Version Concurrency Control (MVCC) to provide ACID transaction guarantees while maintaining read-write parallelism. We dissect write-ahead logging (WAL), snapshot isolation levels, vacuum garbage collection, and B-tree index locking mechanisms under high OLTP concurrency.', 
 '10.14778/3415478.3415512', '2020-08-31', 25, 'VLDB 2020', '2024-01-24'),

(20, 'NoSQL vs Relational Databases: Performance Benchmarks for Document and Key-Value Workloads', 
 'Modern data architectures increasingly combine relational PostgreSQL with document stores like MongoDB. We perform empirical throughput and latency benchmarking across structured ACID updates versus polymorphic schema-free document aggregations, formulating multi-model design guidelines.', 
 '10.1109/icde.2021.00192', '2021-04-19', 27, 'IEEE ICDE 2021', '2024-01-24'),

(21, 'Hybrid Search Architectures Combining Dense Vector Embeddings and Sparse Inverted Indexes', 
 'Dense semantic retrieval excels at conceptual semantic matching but occasionally misses exact domain-specific terminology. We formulate Reciprocal Rank Fusion (RRF) pipelines that fuse BM25 / PostgreSQL full-text search scores with dense vector cosine similarity, boosting mean reciprocal rank by 18%.', 
 '10.1145/sigir.2022.188', '2022-07-11', 26, 'ACM SIGIR 2022', '2024-01-25'),

(22, 'Diffusion Models Beat GANs on Image Synthesis', 
 'We show that classifier-guided diffusion models can achieve image sample quality superior to current state-of-the-art generative adversarial networks. By conditioning denoising score-matching steps on classifier gradients, our architecture generates high-fidelity visual samples with stable training.', 
 '10.1145/diffusion.2021.08', '2021-12-05', 30, 'NeurIPS 2021', '2024-01-25'),

(23, 'Securing Machine Learning Pipelines Against Data Poisoning and Adversarial Attacks', 
 'Adversarial manipulation of training corpora can inject backdoors into neural classifiers without degrading validation accuracy on clean benchmarks. We introduce robust certified defenses using spectral signature analysis and loss gradient anomaly clustering across distributed training pipelines.', 
 '10.1109/tifs.2022.31889', '2022-09-14', 18, 'IEEE TIFS 2022', '2024-01-26'),

(24, 'CRISPR-Cas9 Genome Editing Optimization Using Transformer Sequence Modeling', 
 'Off-target mutations present significant hurdles for clinical gene therapy. We train deep transformer sequence encoders on millions of guide-RNA cleavage assays to predict on-target efficiency and off-target cleavage probabilities with single-nucleotide precision.', 
 '10.1038/s41587-023-01890', '2023-05-18', 20, 'Nature Biotechnology', '2024-01-26'),

(25, 'Serverless Computing: Current Trends and Open Challenges in Cloud Architectures', 
 'Function-as-a-Service (FaaS) abstractions free cloud developers from managing server infrastructure. However, cold start latencies, stateless storage bottlenecks, and micro-billing granularities introduce architectural challenges for high-throughput database workloads.', 
 '10.1145/cacm.2021.3411', '2021-03-20', 22, 'Communications of the ACM', '2024-01-27'),

(26, 'Paxos Made Simple and Fault-Tolerant State Machine Replication', 
 'The Paxos algorithm for implementing a fault-tolerant distributed consensus protocol has been regarded as difficult to understand. This paper demonstrates that consensus in asynchronous networks is a straightforward consequence of basic quorum intersecting invariants.', 
 '10.1145/acm.paxos.2001', '2001-11-01', 55, 'ACM SIGACT News', '2024-01-27'),

(27, 'C-Store: A Column-Oriented DBMS for Analytics Workloads', 
 'Traditional DBMS architectures store records contiguously in rows, optimizing for write-heavy OLTP. We present C-Store, a column-oriented store designed for read-intensive analytical query workloads. C-Store compresses attribute vectors and executes vectorized column-wise operators for 10x speedups.', 
 '10.5555/1083592.1083658', '2005-08-30', 40, 'VLDB 2005', '2024-01-28'),

(28, 'Self-Supervised Learning in Biomedical Image Segmentation', 
 'Annotating pixel-level medical imagery requires expensive radiologist time. We propose a self-supervised volumetric contrastive pre-training framework that learns anatomical invariance from unlabelled CT and MRI scans, reducing downstream labelled data requirements by 80%.', 
 '10.1109/tmi.2022.31671', '2022-04-12', 19, 'IEEE Transactions on Medical Imaging', '2024-01-28'),

(29, 'Semantic Recommendation Systems in Academic Literature: Graph vs Embedding Approaches', 
 'Navigating scientific repositories requires accurate personalized paper recommendations. We systematically evaluate citation graph random-walks against dense vector embedding cosine similarity across 50,000 academic papers, concluding that hybrid architectures yield optimal relevance.', 
 '10.1145/recsys.2023.49', '2023-09-18', 21, 'ACM RecSys 2023', '2024-01-29'),

(30, 'Quantum Supremacy Using a Programmable Superconducting Processor', 
 'The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical computer. We demonstrate quantum supremacy using a programmable superconducting processor with 53 qubits to sample random quantum circuits.', 
 '10.1038/s41586-019-1666-5', '2019-10-23', 39, 'Nature', '2024-01-29'),

(31, 'Autonomous Network Threat Hunting with Multi-Agent Reinforcement Learning', 
 'Advanced persistent threats (APTs) dwell stealthily inside enterprise intranets. We introduce cooperative multi-agent deep reinforcement learning teams that execute proactive threat hunting sweeps across distributed network telemetry graphs to identify lateral movement patterns.', 
 '10.1109/tdsc.2023.32881', '2023-08-11', 16, 'IEEE Transactions on Dependable and Secure Computing', '2024-01-30'),

(32, 'Scalable Vector Search over Billion-Scale Embeddings in Cloud Data Warehouses', 
 'Integrating vector similarity search directly into cloud database warehouses avoids cumbersome vector ETL pipelines. We evaluate SIMD-accelerated product quantization and inverted index filtering techniques implemented directly inside relational database query engines.', 
 '10.1145/vldb.2023.901', '2023-11-04', 23, 'VLDB 2023', '2024-01-30')
ON CONFLICT (paper_id) DO NOTHING;

-- 5. SEED PAPER_AUTHOR (M:N Linkages with Author Orders)
INSERT INTO PAPER_AUTHOR (paper_id, author_id, author_order) VALUES
(1, 4, 1), (1, 10, 2),
(2, 5, 1), (2, 2, 2),
(3, 4, 1),
(4, 1, 1), (4, 3, 2),
(5, 10, 1),
(6, 10, 1), (6, 6, 2),
(7, 10, 1),
(8, 11, 1), (8, 15, 2),
(9, 8, 1), (9, 14, 2),
(10, 8, 1),
(11, 15, 1), (11, 11, 2),
(12, 6, 1), (12, 7, 2),
(13, 1, 1), (13, 2, 2),
(14, 8, 1), (14, 7, 2),
(15, 12, 1),
(16, 5, 1), (16, 14, 2),
(17, 4, 1), (17, 10, 2),
(18, 3, 1), (18, 4, 2),
(19, 6, 1), (19, 7, 2),
(20, 6, 1), (20, 11, 2),
(21, 4, 1), (21, 6, 2),
(22, 2, 1), (22, 3, 2),
(23, 8, 1),
(24, 13, 1), (24, 1, 2),
(25, 15, 1), (25, 11, 2),
(26, 9, 1),
(27, 6, 1),
(28, 5, 1), (28, 13, 2),
(29, 4, 1), (29, 6, 2), (29, 14, 3),
(30, 12, 1), (30, 10, 2),
(31, 8, 1), (31, 15, 2),
(32, 6, 1), (32, 10, 2), (32, 11, 3)
ON CONFLICT (paper_id, author_id) DO NOTHING;

-- 6. SEED PAPER_AREA (M:N Categorizations)
INSERT INTO PAPER_AREA (paper_id, area_id) VALUES
(1, 1), (1, 2),
(2, 1), (2, 3),
(3, 2), (3, 1),
(4, 1), (4, 3),
(5, 4), (5, 6),
(6, 4), (6, 6),
(7, 6), (7, 4),
(8, 6), (8, 4),
(9, 1), (9, 5),
(10, 5), (10, 1),
(11, 6), (11, 1),
(12, 4), (12, 1),
(13, 1),
(14, 5), (14, 4),
(15, 7),
(16, 3), (16, 1),
(17, 2), (17, 1), (17, 4),
(18, 2), (18, 1),
(19, 4),
(20, 4), (20, 6),
(21, 4), (21, 2),
(22, 3), (22, 1),
(23, 5), (23, 1),
(24, 8), (24, 1),
(25, 6),
(26, 6),
(27, 4),
(28, 3), (28, 8),
(29, 4), (29, 1),
(30, 7),
(31, 5), (31, 1),
(32, 4), (32, 1)
ON CONFLICT (paper_id, area_id) DO NOTHING;

-- 7. SEED CITATION (45+ Citation Pairs with Recursive Multi-Level Chains)
-- Notice: Every pair satisfies citing_paper_id != cited_paper_id
INSERT INTO CITATION (citing_paper_id, cited_paper_id) VALUES
(3, 1),   -- BERT cites Transformer
(17, 1),  -- RAG cites Transformer
(17, 3),  -- RAG cites BERT
(18, 1),  -- LLaMA cites Transformer
(18, 3),  -- LLaMA cites BERT
(21, 1),  -- Hybrid Search cites Transformer
(21, 12), -- Hybrid Search cites Vector DB Indexing
(21, 17), -- Hybrid Search cites RAG
(29, 1),  -- Semantic RecSys cites Transformer
(29, 12), -- Semantic RecSys cites Vector DB Indexing
(29, 21), -- Semantic RecSys cites Hybrid Search
(32, 12), -- Billion Vector Search cites Vector DB Indexing
(32, 21), -- Billion Vector Search cites Hybrid Search
(32, 19), -- Billion Vector Search cites PostgreSQL MVCC
(16, 2),  -- SimCLR cites ResNet
(22, 4),  -- Diffusion cites GAN
(22, 2),  -- Diffusion cites ResNet
(28, 2),  -- Biomedical Image cites ResNet
(28, 16), -- Biomedical Image cites SimCLR
(24, 1),  -- CRISPR Cas9 cites Transformer
(24, 3),  -- CRISPR Cas9 cites BERT
(10, 9),  -- Network Intrusion cites Differential Privacy
(23, 9),  -- Adversarial ML cites Differential Privacy
(31, 10), -- Threat Hunting cites Network Intrusion
(31, 23), -- Threat Hunting cites Adversarial ML
(8, 7),   -- Spark RDD cites MapReduce
(6, 26),  -- Spanner cites Paxos
(8, 26),  -- Spark cites Paxos
(11, 8),  -- Cloud Allocation cites Spark
(20, 6),  -- NoSQL vs Relational cites Spanner
(20, 19), -- NoSQL vs Relational cites PostgreSQL MVCC
(20, 27), -- NoSQL vs Relational cites C-Store
(25, 8),  -- Serverless cites Spark
(25, 11), -- Serverless cites Cloud Allocation
(14, 6),  -- ZK Proofs DB cites Spanner
(14, 19), -- ZK Proofs DB cites PostgreSQL MVCC
(12, 1),  -- Vector DB Indexing cites Transformer
(12, 5),  -- Vector DB Indexing cites Web Search Engine
(30, 15), -- Quantum Supremacy cites Quantum Algorithms
(13, 2),  -- GCN cites ResNet
(13, 1),  -- GCN cites Transformer
(27, 5),  -- C-Store cites Web Search Engine
(19, 5),  -- PostgreSQL cites Web Search Engine
(19, 27)  -- PostgreSQL cites C-Store
ON CONFLICT (citing_paper_id, cited_paper_id) DO NOTHING;

-- 8. SEED BOOKMARK (Saved Papers for Students & Admins)
INSERT INTO BOOKMARK (user_id, paper_id, created_at) VALUES
(4, 1, '2024-02-02 14:00:00Z'),
(4, 3, '2024-02-03 10:15:00Z'),
(4, 17, '2024-02-04 16:30:00Z'),
(4, 21, '2024-02-05 11:45:00Z'),
(5, 10, '2024-02-06 09:20:00Z'),
(5, 23, '2024-02-07 14:10:00Z'),
(5, 31, '2024-02-08 17:00:00Z'),
(6, 6, '2024-02-09 13:00:00Z'),
(6, 12, '2024-02-10 15:30:00Z'),
(6, 19, '2024-02-11 18:20:00Z'),
(7, 2, '2024-02-12 11:10:00Z'),
(7, 16, '2024-02-13 14:40:00Z'),
(7, 22, '2024-02-14 16:50:00Z'),
(8, 24, '2024-02-15 10:30:00Z'),
(8, 28, '2024-02-16 12:45:00Z'),
(1, 12, '2024-02-17 09:00:00Z'),
(1, 21, '2024-02-18 10:00:00Z'),
(2, 6, '2024-02-19 11:00:00Z'),
(3, 19, '2024-02-20 12:00:00Z')
ON CONFLICT (user_id, paper_id) DO NOTHING;

-- 9. SEED SEARCH_HISTORY (Logs of User Discovery Inquiries)
INSERT INTO SEARCH_HISTORY (search_id, user_id, search_query, search_type, search_date) VALUES
(1, 4, 'transformer sequence modeling self-attention', 'KEYWORD', '2024-02-02 13:50:00Z'),
(2, 4, 'How do deep bidirectional transformers understand context?', 'SEMANTIC', '2024-02-03 10:10:00Z'),
(3, 4, 'retrieval augmented generation dense vector embeddings', 'HYBRID', '2024-02-04 16:25:00Z'),
(4, 5, 'network intrusion detection packet header analysis', 'KEYWORD', '2024-02-06 09:15:00Z'),
(5, 5, 'How can machine learning detect network intrusion attacks?', 'SEMANTIC', '2024-02-06 09:18:00Z'),
(6, 5, 'mitigating adversarial data poisoning in neural networks', 'HYBRID', '2024-02-07 14:05:00Z'),
(7, 6, 'PostgreSQL MVCC concurrency control vacuum', 'KEYWORD', '2024-02-09 12:55:00Z'),
(8, 6, 'How do vector databases perform approximate nearest neighbor search?', 'SEMANTIC', '2024-02-10 15:20:00Z'),
(9, 7, 'deep residual networks for computer vision classification', 'KEYWORD', '2024-02-12 11:05:00Z'),
(10, 7, 'contrastive representation learning without negative pairs', 'SEMANTIC', '2024-02-13 14:35:00Z'),
(11, 8, 'CRISPR Cas9 off-target cleavage prediction deep learning', 'KEYWORD', '2024-02-15 10:25:00Z'),
(12, 1, 'high dimensional vector indexing HNSW benchmarks', 'HYBRID', '2024-02-17 08:50:00Z')
ON CONFLICT (search_id) DO NOTHING;

-- Reset sequence counters for all serial primary keys
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM USERS));
SELECT setval('authors_author_id_seq', (SELECT MAX(author_id) FROM AUTHORS));
SELECT setval('research_paper_paper_id_seq', (SELECT MAX(paper_id) FROM RESEARCH_PAPER));
SELECT setval('research_area_area_id_seq', (SELECT MAX(area_id) FROM RESEARCH_AREA));
SELECT setval('search_history_search_id_seq', (SELECT MAX(search_id) FROM SEARCH_HISTORY));

