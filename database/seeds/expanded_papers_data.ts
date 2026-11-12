export interface JournalSeed {
  journal_id: number;
  journal_name: string;
  publisher: string;
  issn: string;
}

export interface ConferenceSeed {
  conference_id: number;
  conference_name: string;
  location: string;
  year: number;
}

export interface AuthorSeed {
  author_id: number;
  name: string;
  affiliation: string;
  email: string;
  bio: string;
  research_interests: string[];
  metrics: {
    h_index: number;
    total_citations: number;
    total_publications: number;
  };
  external_profiles: {
    google_scholar?: string;
    orcid?: string;
    dblp?: string;
    github?: string;
  };
}

export interface ResearchAreaSeed {
  area_id: number;
  area_name: string;
  description: string;
  overview: string;
  sub_topics: string[];
  emerging_trends: string[];
  top_venues: string[];
}

export interface PaperSeed {
  paper_id: number;
  title: string;
  abstract: string;
  doi: string;
  publication_date: string;
  citation_count: number;
  source: string;
  source_type: 'JOURNAL' | 'CONFERENCE';
  journal_id?: number | null;
  conference_id?: number | null;
  author_ids: number[];
  area_ids: number[];
  keywords: string[];
  sections: { heading: string; content: string }[];
  references: { title: string; authors: string[]; year: number; doi?: string }[];
}

export const JOURNALS_SEED: JournalSeed[] = [
  { journal_id: 1, journal_name: 'IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI)', publisher: 'IEEE Computer Society', issn: '0162-8828' },
  { journal_id: 2, journal_name: 'ACM Transactions on Database Systems (TODS)', publisher: 'ACM', issn: '0362-5915' },
  { journal_id: 3, journal_name: 'Journal of Machine Learning Research (JMLR)', publisher: 'Microtome Publishing', issn: '1532-4435' },
  { journal_id: 4, journal_name: 'Communications of the ACM (CACM)', publisher: 'ACM', issn: '0001-0782' },
  { journal_id: 5, journal_name: 'IEEE Transactions on Information Forensics and Security (TIFS)', publisher: 'IEEE Signal Processing Society', issn: '1556-6013' },
  { journal_id: 6, journal_name: 'The VLDB Journal', publisher: 'Springer Nature', issn: '1066-8888' },
  { journal_id: 7, journal_name: 'IEEE Transactions on Software Engineering (TSE)', publisher: 'IEEE Computer Society', issn: '0098-5589' },
  { journal_id: 8, journal_name: 'Nature Machine Intelligence', publisher: 'Nature Publishing Group', issn: '2522-5839' },
  { journal_id: 9, journal_name: 'IEEE Transactions on Cloud Computing (TCC)', publisher: 'IEEE Computer Society', issn: '2168-7161' },
  { journal_id: 10, journal_name: 'ACM Transactions on Computer Systems (TOCS)', publisher: 'ACM', issn: '0734-2071' },
  { journal_id: 11, journal_name: 'IEEE Transactions on Dependable and Secure Computing (TDSC)', publisher: 'IEEE Computer Society', issn: '1545-5971' },
  { journal_id: 12, journal_name: 'Bioinformatics', publisher: 'Oxford University Press', issn: '1367-4803' },
];

export const CONFERENCES_SEED: ConferenceSeed[] = [
  { conference_id: 1, conference_name: 'NeurIPS (Conference on Neural Information Processing Systems)', location: 'New Orleans, LA, USA', year: 2017 },
  { conference_id: 2, conference_name: 'IEEE CVPR (Computer Vision and Pattern Recognition)', location: 'Las Vegas, NV, USA', year: 2016 },
  { conference_id: 3, conference_name: 'ACL (Association for Computational Linguistics)', location: 'Melbourne, Australia', year: 2018 },
  { conference_id: 4, conference_name: 'ICML (International Conference on Machine Learning)', location: 'Vienna, Austria', year: 2020 },
  { conference_id: 5, conference_name: 'ACM SIGMOD International Conference on Management of Data', location: 'San Francisco, CA, USA', year: 2016 },
  { conference_id: 6, conference_name: 'USENIX OSDI (Operating Systems Design and Implementation)', location: 'Carlsbad, CA, USA', year: 2014 },
  { conference_id: 7, conference_name: 'USENIX NSDI (Networked Systems Design and Implementation)', location: 'San Jose, CA, USA', year: 2012 },
  { conference_id: 8, conference_name: 'USENIX ATC (Annual Technical Conference)', location: 'Boston, MA, USA', year: 2014 },
  { conference_id: 9, conference_name: 'ACM CCS (Computer and Communications Security)', location: 'Vienna, Austria', year: 2016 },
  { conference_id: 10, conference_name: 'IEEE S&P (Symposium on Security and Privacy - Oakland)', location: 'San Francisco, CA, USA', year: 2018 },
  { conference_id: 11, conference_name: 'USENIX Security Symposium', location: 'Baltimore, MD, USA', year: 2019 },
  { conference_id: 12, conference_name: 'VLDB (International Conference on Very Large Data Bases)', location: 'New Delhi, India', year: 2016 },
  { conference_id: 13, conference_name: 'ICLR (International Conference on Learning Representations)', location: 'Addis Ababa, Ethiopia', year: 2020 },
  { conference_id: 14, conference_name: 'IEEE INFOCOM', location: 'Toronto, Canada', year: 2020 },
  { conference_id: 15, conference_name: 'ACM RecSys (Recommender Systems)', location: 'Singapore', year: 2023 },
  { conference_id: 16, conference_name: 'ACM SOSP (Symposium on Operating Systems Principles)', location: 'Koblenz, Germany', year: 2021 },
  { conference_id: 17, conference_name: 'IEEE ICSE (International Conference on Software Engineering)', location: 'Seoul, South Korea', year: 2023 },
  { conference_id: 18, conference_name: 'ACM SIGCOMM', location: 'Amsterdam, Netherlands', year: 2022 },
  { conference_id: 19, conference_name: 'IEEE Micro', location: 'Atlanta, GA, USA', year: 2022 },
  { conference_id: 20, conference_name: 'IEEE/ACM Supercomputing (SC)', location: 'Denver, CO, USA', year: 2023 },
];

export const RESEARCH_AREAS_SEED: ResearchAreaSeed[] = [
  {
    area_id: 1,
    area_name: 'Machine Learning & Deep Learning',
    description: 'Foundational neural architectures, gradient optimization, generative modeling, and self-supervised paradigms.',
    overview: 'Machine learning studies algorithms that improve through experience, focusing on deep representations, generalization theory, and probabilistic reasoning.',
    sub_topics: ['Deep Neural Networks', 'Generative Adversarial Networks', 'Diffusion Models', 'Optimization & Loss Landscapes', 'Self-Supervised Learning'],
    emerging_trends: ['Physics-informed neural networks', 'Energy-based models', 'Implicit neural representations', 'Test-time compute scaling'],
    top_venues: ['NeurIPS', 'ICML', 'ICLR', 'JMLR'],
  },
  {
    area_id: 2,
    area_name: 'Natural Language Processing & LLMs',
    description: 'Transformer architectures, large language models, semantic representation, and question answering systems.',
    overview: 'Computational approaches to understanding, generating, and manipulating human language via dense token representations and autoregressive inference.',
    sub_topics: ['Transformers & Attention', 'Pretraining & Instruction Fine-Tuning', 'Retrieval-Augmented Generation (RAG)', 'Semantic Parsing', 'Machine Translation'],
    emerging_trends: ['Chain-of-thought reasoning', 'Parameter-efficient fine-tuning (PEFT)', 'Sparse mixture-of-experts', 'Direct preference optimization (DPO)'],
    top_venues: ['ACL', 'EMNLP', 'NAACL', 'TACL'],
  },
  {
    area_id: 3,
    area_name: 'Computer Vision & Multi-Modal AI',
    description: 'Convolutional and visual attention networks, image segmentation, object detection, and cross-modal reasoning.',
    overview: 'Visual perception, pattern recognition, scene understanding, and multi-modal integration spanning image, video, and audio synthesis.',
    sub_topics: ['Vision Transformers (ViT)', 'Residual Networks', 'Semantic Segmentation', 'Object Detection', 'Multi-Modal Vision-Language'],
    emerging_trends: ['Segment Anything Models (SAM)', '3D Gaussian Splatting', 'Embodied visual perception', 'Diffusion-based video generation'],
    top_venues: ['CVPR', 'ICCV', 'ECCV', 'IEEE TPAMI'],
  },
  {
    area_id: 4,
    area_name: 'Database Systems & Data Engineering',
    description: 'Relational query optimization, transaction processing, vector databases, column stores, and NoSQL systems.',
    overview: 'Core principles of data storage, indexing structures, query execution engines, ACID guarantees, and high-dimensional vector similarity retrieval.',
    sub_topics: ['Relational Query Optimization', 'Multi-Model Databases', 'Vector Indexing (HNSW/IVF)', 'Distributed Transactions', 'Columnar DBMS'],
    emerging_trends: ['Learned database indexes', 'Serverless vector search', 'Hardware-accelerated query processing', 'Polyglot transactional consistency'],
    top_venues: ['ACM SIGMOD', 'VLDB', 'IEEE ICDE', 'The VLDB Journal'],
  },
  {
    area_id: 5,
    area_name: 'Cybersecurity & Network Defense',
    description: 'Intrusion detection, adversarial machine learning, cryptographic protocols, and secure multi-party computation.',
    overview: 'Protecting computer systems, network communication, enterprise infrastructures, and machine learning models from adversarial exploitation.',
    sub_topics: ['Intrusion Detection Systems', 'Adversarial Machine Learning', 'Zero-Trust Architecture', 'Cryptographic Protocols', 'Software Vulnerability Analysis'],
    emerging_trends: ['AI-driven automated threat hunting', 'Post-quantum signature schemes', 'Confidential computing enclaves', 'Supply chain security'],
    top_venues: ['IEEE S&P (Oakland)', 'USENIX Security', 'ACM CCS', 'NDSS'],
  },
  {
    area_id: 6,
    area_name: 'Distributed Systems & Cloud Computing',
    description: 'Consensus protocols, large-scale data processing, serverless architectures, and fault-tolerant cluster storage.',
    overview: 'Scalable computation and storage across heterogeneous clusters, asynchronous consensus protocols, and virtualization abstractions.',
    sub_topics: ['Consensus & Replication (Paxos/Raft)', 'Cluster Scheduling', 'Serverless Computing (FaaS)', 'Distributed Storage', 'Microservices'],
    emerging_trends: ['Geo-distributed transactions', 'Disaggregated memory architectures', 'Edge-cloud continuum', 'Carbon-aware computing'],
    top_venues: ['OSDI', 'SOSP', 'USENIX NSDI', 'ACM TOCS'],
  },
  {
    area_id: 7,
    area_name: 'Blockchain & Decentralized Ledger Technologies',
    description: 'Distributed ledgers, smart contracts, Byzantine fault tolerance, zero-knowledge rollups, and consensus protocols.',
    overview: 'Cryptographically secured peer-to-peer transaction networks, verifiable computation, decentralized consensus, and automated smart contracts.',
    sub_topics: ['Byzantine Fault Tolerant Consensus', 'Proof-of-Stake Protocols', 'Zero-Knowledge Proofs (ZK-SNARKs)', 'Smart Contract Verification', 'Layer-2 Scalability'],
    emerging_trends: ['Decentralized identity', 'MEV mitigation', 'Cross-chain atomic swaps', 'Verifiable rollups'],
    top_venues: ['IEEE S&P', 'ACM CCS', 'Financial Cryptography', 'ACM SIGCOMM'],
  },
  {
    area_id: 8,
    area_name: 'Quantum Computing & Cryptography',
    description: 'Quantum algorithms, quantum error correction, post-quantum cryptographic systems, and qubit Hamiltonian simulation.',
    overview: 'Harnessing quantum mechanics to process information, execute sub-linear search, factor integers, and simulate molecular Hamiltonians.',
    sub_topics: ['Quantum Algorithms (Shor/Grover)', 'Quantum Error Correction', 'Superconducting Qubits', 'Quantum Supremacy Verification', 'Post-Quantum Cryptography'],
    emerging_trends: ['Fault-tolerant surface codes', 'Quantum machine learning', 'Lattice-based cryptography', 'Hybrid classical-quantum solvers'],
    top_venues: ['Physical Review Letters', 'Nature', 'IEEE QCE', 'ACM STOC'],
  },
  {
    area_id: 9,
    area_name: 'Bioinformatics & Computational Biology',
    description: 'Genome sequencing algorithms, protein structure prediction, deep learning for molecular biology, and transcriptomics.',
    overview: 'Computational approaches to biological data, structural proteomics, molecular dynamics simulations, and spatial genomics.',
    sub_topics: ['Protein Folding Prediction', 'Genomic Sequence Alignment', 'Cryo-EM Image Reconstruction', 'Molecular Docking', 'Single-Cell Transcriptomics'],
    emerging_trends: ['Generative protein design', 'Diffusion models for drug discovery', 'Multi-omics foundation models', 'CRISPR off-target predictors'],
    top_venues: ['Bioinformatics', 'Nature Biotechnology', 'Cell', 'RECOMB'],
  },
];

export const AUTHORS_SEED: AuthorSeed[] = [
  {
    author_id: 1,
    name: 'Dr. Yoshua Bengio',
    affiliation: 'Mila - Quebec AI Institute / Univ. of Montreal',
    email: 'yoshua.bengio@mila.quebec',
    bio: 'Turing Award laureate recognized for pioneering deep learning, generative modeling, and representation learning.',
    research_interests: ['Deep Learning', 'Generative Modeling', 'Representation Learning', 'Consciousness & AI Safety'],
    metrics: { h_index: 185, total_citations: 495000, total_publications: 620 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=kukA0hoAAAAJ', orcid: '0000-0002-1313-4087' },
  },
  {
    author_id: 2,
    name: 'Dr. Geoffrey Hinton',
    affiliation: 'University of Toronto / Vector Institute',
    email: 'geoffrey.hinton@utoronto.ca',
    bio: 'Turing Award laureate known as the Godfather of AI for backpropagation, capsule networks, and deep neural nets.',
    research_interests: ['Backpropagation', 'Capsule Networks', 'Boltzmann Machines', 'Representation Learning'],
    metrics: { h_index: 192, total_citations: 620000, total_publications: 410 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=JicYPdAAAAAJ', orcid: '0000-0002-3112-9876' },
  },
  {
    author_id: 3,
    name: 'Dr. Yann LeCun',
    affiliation: 'New York University / Meta FAIR',
    email: 'yann.lecun@nyu.edu',
    bio: 'Turing Award laureate who invented Convolutional Neural Networks (CNNs) and pioneered self-supervised learning.',
    research_interests: ['Convolutional Networks', 'Self-Supervised Learning', 'Energy-Based Models', 'Computer Vision'],
    metrics: { h_index: 178, total_citations: 340000, total_publications: 390 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=WLN3QrAAAAAJ', orcid: '0000-0002-1994-3540' },
  },
  {
    author_id: 4,
    name: 'Dr. Christopher D. Manning',
    affiliation: 'Stanford University (NLP Group)',
    email: 'manning@cs.stanford.edu',
    bio: 'Thomas M. Siebel Professor in Machine Learning and Professor of Linguistics and Computer Science at Stanford.',
    research_interests: ['Natural Language Processing', 'Deep Learning for NLP', 'Computational Linguistics', 'Language Models'],
    metrics: { h_index: 165, total_citations: 285000, total_publications: 350 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=1yzEnNsAAAAJ', orcid: '0000-0001-6789-2234' },
  },
  {
    author_id: 5,
    name: 'Dr. Fei-Fei Li',
    affiliation: 'Stanford University (HAI / Vision Lab)',
    email: 'feifeili@stanford.edu',
    bio: 'Sequoia Professor in the Computer Science Department at Stanford University and creator of ImageNet.',
    research_interests: ['Computer Vision', 'ImageNet', 'Cognitive Neuroscience', 'Human-Centered AI'],
    metrics: { h_index: 158, total_citations: 260000, total_publications: 330 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=rD9OS44AAAAJ', orcid: '0000-0002-7654-3210' },
  },
  {
    author_id: 6,
    name: 'Dr. Michael Stonebraker',
    affiliation: 'MIT CSAIL (Database Group)',
    email: 'stonebraker@csail.mit.edu',
    bio: 'Turing Award laureate database pioneer who created Ingres, Postgres, Vertica, VoltDB, and SciDB.',
    research_interests: ['Relational Database Systems', 'Column Stores', 'Stream Processing', 'Data Integration'],
    metrics: { h_index: 125, total_citations: 110000, total_publications: 290 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=9_2e9H4AAAAJ', orcid: '0000-0001-9012-3456' },
  },
  {
    author_id: 7,
    name: 'Dr. Jennifer Widom',
    affiliation: 'Stanford University (School of Engineering)',
    email: 'widom@cs.stanford.edu',
    bio: 'Frederick Emmons Terman Dean of Engineering and pioneer in active database systems, data warehousing, and stream mining.',
    research_interests: ['Database Systems', 'Stream Data Processing', 'Semi-Structured Data', 'Data Provenance'],
    metrics: { h_index: 108, total_citations: 82000, total_publications: 210 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=TzZ5v9AAAAAJ', orcid: '0000-0002-3456-7890' },
  },
  {
    author_id: 8,
    name: 'Dr. Dawn Song',
    affiliation: 'University of California, Berkeley',
    email: 'dawnsong@berkeley.edu',
    bio: 'Professor of Computer Science at UC Berkeley and MacArthur Fellow recognized for AI security and blockchain privacy.',
    research_interests: ['Computer Security', 'Adversarial Machine Learning', 'Blockchain Systems', 'Applied Cryptography'],
    metrics: { h_index: 122, total_citations: 98000, total_publications: 260 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=rUv7K4AAAAAJ', orcid: '0000-0003-4567-8901' },
  },
  {
    author_id: 9,
    name: 'Dr. Leslie Lamport',
    affiliation: 'Microsoft Research (Distributed Systems)',
    email: 'lamport@microsoft.com',
    bio: 'Turing Award laureate who defined fundamental distributed algorithms, logical clocks, Paxos, and TLA+.',
    research_interests: ['Distributed Systems', 'Consensus Algorithms', 'Formal Verification', 'Concurrency'],
    metrics: { h_index: 115, total_citations: 145000, total_publications: 180 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=l_sM8p8AAAAJ', orcid: '0000-0001-5678-9012' },
  },
  {
    author_id: 10,
    name: 'Dr. Jeffrey Dean',
    affiliation: 'Google DeepMind & Research',
    email: 'jeff@google.com',
    bio: 'Google Chief Scientist who co-designed Spanner, MapReduce, BigTable, TensorFlow, and TPU hardware systems.',
    research_interests: ['Large-Scale Distributed Systems', 'Machine Learning Infrastructure', 'Compiler Design', 'Databases'],
    metrics: { h_index: 152, total_citations: 290000, total_publications: 240 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=NMS69RAAAAAJ', orcid: '0000-0002-6789-0123' },
  },
  {
    author_id: 11,
    name: 'Dr. Matei Zaharia',
    affiliation: 'UC Berkeley / Databricks',
    email: 'matei@cs.berkeley.edu',
    bio: 'Co-founder of Databricks and creator of Apache Spark, Delta Lake, and MLflow.',
    research_interests: ['Large-Scale Data Analytics', 'Distributed Systems', 'Machine Learning Infrastructure', 'Data Lakes'],
    metrics: { h_index: 102, total_citations: 92000, total_publications: 170 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=qLhM7f0AAAAJ', orcid: '0000-0003-7890-1234' },
  },
  {
    author_id: 12,
    name: 'Dr. Peter Shor',
    affiliation: 'MIT Department of Mathematics',
    email: 'shor@math.mit.edu',
    bio: 'Morss Professor of Applied Mathematics at MIT and inventor of Shor algorithm for polynomial-time prime factorization.',
    research_interests: ['Quantum Algorithms', 'Quantum Information Theory', 'Quantum Error Correction'],
    metrics: { h_index: 78, total_citations: 64000, total_publications: 130 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=K-VqZzYAAAAJ', orcid: '0000-0001-8901-2345' },
  },
  {
    author_id: 13,
    name: 'Dr. Aviv Regev',
    affiliation: 'Genentech Research & Early Development',
    email: 'regev.aviv@gene.com',
    bio: 'Computational and systems biologist who spearheaded the Human Cell Atlas and single-cell RNA sequencing methods.',
    research_interests: ['Computational Biology', 'Single-Cell Genomics', 'Machine Learning for Drug Discovery'],
    metrics: { h_index: 142, total_citations: 130000, total_publications: 310 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=Fh0g3b8AAAAJ', orcid: '0000-0002-9012-3456' },
  },
  {
    author_id: 14,
    name: 'Dr. Andrew Ng',
    affiliation: 'Stanford University / Landing AI',
    email: 'ang@cs.stanford.edu',
    bio: 'Adjunct Professor at Stanford, founder of DeepLearning.AI, Coursera, and former founding lead of Google Brain.',
    research_interests: ['Machine Learning', 'Deep Learning', 'Robotics', 'Data-Centric AI'],
    metrics: { h_index: 154, total_citations: 280000, total_publications: 290 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=mG4imqAAAAAJ', orcid: '0000-0002-0123-4567' },
  },
  {
    author_id: 15,
    name: 'Dr. Ion Stoica',
    affiliation: 'UC Berkeley (RISELab)',
    email: 'istoica@cs.berkeley.edu',
    bio: 'Professor at UC Berkeley, co-founder of Databricks and Anyscale, and co-creator of Ray, Mesos, and Chord.',
    research_interests: ['Distributed Computing', 'Cloud Architectures', 'Peer-to-Peer Networks', 'AI Systems'],
    metrics: { h_index: 128, total_citations: 140000, total_publications: 280 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=ZcI3oQcAAAAJ', orcid: '0000-0003-1234-5678' },
  },
  {
    author_id: 16,
    name: 'Dr. Kaiming He',
    affiliation: 'Meta AI / MIT',
    email: 'kaiminghe@mit.edu',
    bio: 'Creator of Deep Residual Networks (ResNet) and Mask R-CNN; recipient of multiple CVPR Best Paper Awards.',
    research_interests: ['Computer Vision', 'Deep Learning', 'Self-Supervised Learning', 'Masked Autoencoders'],
    metrics: { h_index: 118, total_citations: 450000, total_publications: 120 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=DhtAF4IAAAAJ', orcid: '0000-0001-2345-6789' },
  },
  {
    author_id: 17,
    name: 'Dr. Alexey Dosovitskiy',
    affiliation: 'Google DeepMind',
    email: 'adosovitskiy@google.com',
    bio: 'Senior Staff Research Scientist who introduced the Vision Transformer (ViT) to Computer Vision.',
    research_interests: ['Vision Transformers', 'Self-Supervised Vision', 'Representation Learning'],
    metrics: { h_index: 68, total_citations: 92000, total_publications: 85 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=6U5vDk4AAAAJ', orcid: '0000-0002-3456-7890' },
  },
  {
    author_id: 18,
    name: 'Dr. Ashish Vaswani',
    affiliation: 'Essential AI',
    email: 'ashish@essential.ai',
    bio: 'Lead author of the seminal paper Attention Is All You Need which introduced the Transformer architecture.',
    research_interests: ['Transformer Architectures', 'Deep Learning for NLP', 'Machine Translation', 'Neural Attention'],
    metrics: { h_index: 52, total_citations: 180000, total_publications: 55 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=x8wH6ZcAAAAJ', orcid: '0000-0003-4567-8901' },
  },
  {
    author_id: 19,
    name: 'Dr. Noam Shazeer',
    affiliation: 'Google DeepMind / Character.AI',
    email: 'shazeer@google.com',
    bio: 'Pioneer of sparse Mixture of Experts, multi-query attention, SwiGLU activations, and Transformer scaling.',
    research_interests: ['Large Language Models', 'Mixture of Experts', 'Attention Mechanisms', 'Conversational AI'],
    metrics: { h_index: 56, total_citations: 170000, total_publications: 60 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=C1tB_0YAAAAJ', orcid: '0000-0001-5678-9012' },
  },
  {
    author_id: 20,
    name: 'Dr. Dan Boneh',
    affiliation: 'Stanford Applied Crypto Group',
    email: 'dabo@cs.stanford.edu',
    bio: 'Professor of Computer Science and Electrical Engineering at Stanford, world-leading authority on applied cryptography.',
    research_interests: ['Applied Cryptography', 'Zero-Knowledge Proofs', 'Blockchain Security', 'Pairing-Based Crypto'],
    metrics: { h_index: 124, total_citations: 115000, total_publications: 260 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=3GzE_k0AAAAJ', orcid: '0000-0002-6789-0123' },
  },
  {
    author_id: 21,
    name: 'Dr. David DeWitt',
    affiliation: 'Univ. of Wisconsin / MIT',
    email: 'dewitt@cs.wisc.edu',
    bio: 'Pioneer of parallel database architectures, Gamma database machine, and benchmark standards in relational DBMS.',
    research_interests: ['Parallel Database Systems', 'Query Processing', 'Relational Engine Optimization', 'Big Data'],
    metrics: { h_index: 98, total_citations: 74000, total_publications: 190 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=yMvJq9AAAAAJ', orcid: '0000-0003-7890-1234' },
  },
  {
    author_id: 22,
    name: 'Dr. Anastasia Ailamaki',
    affiliation: 'EPFL Data-Intensive Applications Lab',
    email: 'anastasia.ailamaki@epfl.ch',
    bio: 'Director of DIAL at EPFL; authority on hardware-conscious database management and cache-conscious indexing.',
    research_interests: ['Hardware-Conscious DBMS', 'In-Memory Query Processing', 'Scientific Data Management'],
    metrics: { h_index: 72, total_citations: 28000, total_publications: 175 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=4_3pM-IAAAAJ', orcid: '0000-0002-8901-2345' },
  },
  {
    author_id: 23,
    name: 'Dr. Joseph M. Hellerstein',
    affiliation: 'UC Berkeley RISELab',
    email: 'hellerstein@cs.berkeley.edu',
    bio: 'Jim Gray Professor of Computer Science at UC Berkeley; founder of Trifacta and pioneer in declarative programming.',
    research_interests: ['Declarative Systems', 'Distributed Databases', 'Interactive Data Exploration', 'Data Cleaning'],
    metrics: { h_index: 96, total_citations: 58000, total_publications: 210 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=N4YjZtQAAAAJ', orcid: '0000-0001-9012-3456' },
  },
  {
    author_id: 24,
    name: 'Dr. Vitalik Buterin',
    affiliation: 'Ethereum Foundation',
    email: 'vitalik@ethereum.org',
    bio: 'Co-founder of Ethereum, designer of smart-contract platform architectures and proof-of-stake consensus protocols.',
    research_interests: ['Blockchain Consensus', 'Proof-of-Stake', 'Zero-Knowledge Cryptography', 'Decentralized Governance'],
    metrics: { h_index: 54, total_citations: 38000, total_publications: 80 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=m2m_n3sAAAAJ', orcid: '0000-0002-0123-4567' },
  },
  {
    author_id: 25,
    name: 'Dr. Elaine Shi',
    affiliation: 'Carnegie Mellon University',
    email: 'runting@cs.cmu.edu',
    bio: 'Associate Professor at CMU recognized for groundbreaking work in distributed consensus, cryptography, and ORAM.',
    research_interests: ['Byzantine Agreement', 'Oblivious RAM', 'Cryptographic Protocols', 'Blockchain Foundations'],
    metrics: { h_index: 76, total_citations: 29000, total_publications: 160 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=f8s9K1oAAAAJ', orcid: '0000-0003-1234-5678' },
  },
  {
    author_id: 26,
    name: 'Dr. Tim Roughgarden',
    affiliation: 'Columbia University',
    email: 'tim.roughgarden@columbia.edu',
    bio: 'Professor of Computer Science at Columbia; expert in algorithmic game theory and economic mechanism design in blockchains.',
    research_interests: ['Algorithmic Game Theory', 'Transaction Fee Mechanisms', 'Blockchain Economics', 'Algorithm Design'],
    metrics: { h_index: 74, total_citations: 34000, total_publications: 150 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=wU9xN38AAAAJ', orcid: '0000-0001-2345-6789' },
  },
  {
    author_id: 27,
    name: 'Dr. Werner Vogels',
    affiliation: 'Amazon.com',
    email: 'werner@amazon.com',
    bio: 'Vice President & Chief Technology Officer at Amazon.com; key architect behind Amazon Web Services (AWS) cloud.',
    research_interests: ['Cloud Computing', 'Eventual Consistency', 'Reliable Distributed Systems', 'Microservices'],
    metrics: { h_index: 68, total_citations: 42000, total_publications: 110 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=8B0bY0YAAAAJ', orcid: '0000-0002-3456-7890' },
  },
  {
    author_id: 28,
    name: 'Dr. Sanjay Ghemawat',
    affiliation: 'Google DeepMind',
    email: 'sanjay@google.com',
    bio: 'Google Fellow who co-designed Google File System (GFS), MapReduce, BigTable, and TensorFlow.',
    research_interests: ['Distributed File Systems', 'Storage Engines', 'High-Performance Concurrency', 'NoSQL Datastores'],
    metrics: { h_index: 82, total_citations: 185000, total_publications: 75 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=D5x6t5cAAAAJ', orcid: '0000-0003-4567-8901' },
  },
  {
    author_id: 29,
    name: 'Dr. Ross Anderson',
    affiliation: 'Cambridge University',
    email: 'ross.anderson@cl.cam.ac.uk',
    bio: 'Professor of Security Engineering at Cambridge; pioneer of security economics, cryptography, and tamper-resistant hardware.',
    research_interests: ['Security Engineering', 'Economics of Information Security', 'Hardware Tamper Resistance'],
    metrics: { h_index: 88, total_citations: 54000, total_publications: 220 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=z6b8H2EAAAAJ', orcid: '0000-0001-5678-9012' },
  },
  {
    author_id: 30,
    name: 'Dr. Stefan Savage',
    affiliation: 'UC San Diego',
    email: 'savage@cs.ucsd.edu',
    bio: 'MacArthur Fellow and Professor at UCSD; renowned authority on internet worm dynamics, automotive cybersecurity, and spam.',
    research_interests: ['Cybercrime Measurement', 'Network Security', 'Automotive Security', 'Internet Routing'],
    metrics: { h_index: 94, total_citations: 62000, total_publications: 195 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=2R3N3tAAAAAJ', orcid: '0000-0002-6789-0123' },
  },
  {
    author_id: 31,
    name: 'Dr. John Preskill',
    affiliation: 'Caltech Quantum Information',
    email: 'preskill@caltech.edu',
    bio: 'Richard P. Feynman Professor of Theoretical Physics at Caltech; coined the terms quantum supremacy and NISQ.',
    research_interests: ['Quantum Computing', 'Quantum Error Correction', 'Topological Quantum Matter', 'Quantum Complexity'],
    metrics: { h_index: 89, total_citations: 68000, total_publications: 210 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=W3M4N2EAAAAJ', orcid: '0000-0003-7890-1234' },
  },
  {
    author_id: 32,
    name: 'Dr. David Baker',
    affiliation: 'Univ. of Washington Institute for Protein Design',
    email: 'dabaker@uw.edu',
    bio: 'Nobel laureate in Chemistry 2024; pioneer in computational protein design, Rosetta macromolecular modeling.',
    research_interests: ['De Novo Protein Design', 'Computational Structural Biology', 'Macromolecular Interactions'],
    metrics: { h_index: 172, total_citations: 165000, total_publications: 540 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=P_x6p28AAAAJ', orcid: '0000-0001-8901-2345' },
  },
  {
    author_id: 33,
    name: 'Dr. John Jumper',
    affiliation: 'Google DeepMind AlphaFold',
    email: 'jumper@google.com',
    bio: 'Nobel laureate in Chemistry 2024; lead creator of AlphaFold2 solving the 50-year-old protein folding grand challenge.',
    research_interests: ['Machine Learning for Structural Biology', 'Protein Structure Prediction', 'Deep Learning'],
    metrics: { h_index: 44, total_citations: 48000, total_publications: 42 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=L0y8g5YAAAAJ', orcid: '0000-0002-9012-3456' },
  },
  {
    author_id: 34,
    name: 'Dr. Shafi Goldwasser',
    affiliation: 'UC Berkeley / MIT Simons Institute',
    email: 'shafi@cs.berkeley.edu',
    bio: 'Turing Award laureate; co-inventor of probabilistic encryption, zero-knowledge proofs, and pseudo-random functions.',
    research_interests: ['Zero-Knowledge Proofs', 'Probabilistic Encryption', 'Complexity Theory', 'Secure Multi-Party Computation'],
    metrics: { h_index: 104, total_citations: 95000, total_publications: 190 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=G9_1h68AAAAJ', orcid: '0000-0003-0123-4567' },
  },
  {
    author_id: 35,
    name: 'Dr. Silvio Micali',
    affiliation: 'MIT CSAIL / Algorand',
    email: 'silvio@csail.mit.edu',
    bio: 'Turing Award laureate; co-inventor of zero-knowledge proofs, verifiable random functions, and founder of Algorand.',
    research_interests: ['Cryptography', 'Zero-Knowledge Proofs', 'Verifiable Random Functions', 'Pure Proof-of-Stake'],
    metrics: { h_index: 92, total_citations: 86000, total_publications: 180 },
    external_profiles: { google_scholar: 'https://scholar.google.com/citations?user=T_2b7qQAAAAJ', orcid: '0000-0001-1234-5678' },
  },
];
