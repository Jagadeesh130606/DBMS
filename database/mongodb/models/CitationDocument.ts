import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICitationLink {
  paper_id: number;
  title: string;
  year?: number;
  context: string;
}

export interface IInfluenceMetrics {
  direct_citations: number;
  second_degree_citations: number;
  pagerank_score: number;
}

export interface ICitationDocument extends Document {
  paper_id: number;
  incoming_citation_count: number;
  outgoing_citation_count: number;
  citing_papers: ICitationLink[];
  cited_papers: ICitationLink[];
  influence_metrics: IInfluenceMetrics;
  createdAt: Date;
  updatedAt: Date;
}

const CitationLinkSchema = new Schema<ICitationLink>({
  paper_id: { type: Number, required: true },
  title: { type: String, required: true },
  year: { type: Number },
  context: { type: String, default: '' },
}, { _id: false });

const InfluenceMetricsSchema = new Schema<IInfluenceMetrics>({
  direct_citations: { type: Number, default: 0 },
  second_degree_citations: { type: Number, default: 0 },
  pagerank_score: { type: Number, default: 0.0 },
}, { _id: false });

const CitationDocumentSchema = new Schema<ICitationDocument>({
  paper_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  incoming_citation_count: {
    type: Number,
    default: 0,
    index: true,
  },
  outgoing_citation_count: {
    type: Number,
    default: 0,
  },
  citing_papers: [CitationLinkSchema],
  cited_papers: [CitationLinkSchema],
  influence_metrics: {
    type: InfluenceMetricsSchema,
    default: () => ({ direct_citations: 0, second_degree_citations: 0, pagerank_score: 0.0 }),
  },
}, {
  timestamps: true,
  collection: 'citation_documents',
});

// Indexes for graph query optimizations and analytics
CitationDocumentSchema.index({ incoming_citation_count: -1 });
CitationDocumentSchema.index({ 'citing_papers.paper_id': 1 });
CitationDocumentSchema.index({ 'cited_papers.paper_id': 1 });

export const CitationDocument: Model<ICitationDocument> =
  mongoose.models.CitationDocument ||
  mongoose.model<ICitationDocument>('CitationDocument', CitationDocumentSchema);

export default CitationDocument;
