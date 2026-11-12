import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAreaMetrics {
  paper_count: number;
  active_researchers: number;
}

export interface IResearchAreaDocument extends Document {
  area_id: number;
  area_name: string;
  description: string;
  overview: string;
  sub_topics: string[];
  emerging_trends: string[];
  top_venues: string[];
  recommended_paper_ids: number[];
  metrics: IAreaMetrics;
  createdAt: Date;
  updatedAt: Date;
}

const AreaMetricsSchema = new Schema<IAreaMetrics>({
  paper_count: { type: Number, default: 0 },
  active_researchers: { type: Number, default: 0 },
}, { _id: false });

const ResearchAreaDocumentSchema = new Schema<IResearchAreaDocument>({
  area_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  area_name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  overview: {
    type: String,
    default: '',
  },
  sub_topics: [{
    type: String,
  }],
  emerging_trends: [{
    type: String,
  }],
  top_venues: [{
    type: String,
  }],
  recommended_paper_ids: [{
    type: Number,
  }],
  metrics: {
    type: AreaMetricsSchema,
    default: () => ({ paper_count: 0, active_researchers: 0 }),
  },
}, {
  timestamps: true,
  collection: 'research_area_documents',
});

ResearchAreaDocumentSchema.index({ sub_topics: 1 });
ResearchAreaDocumentSchema.index({ area_name: 'text', description: 'text', overview: 'text' });

export const ResearchAreaDocument: Model<IResearchAreaDocument> =
  mongoose.models.ResearchAreaDocument ||
  mongoose.model<IResearchAreaDocument>('ResearchAreaDocument', ResearchAreaDocumentSchema);

export default ResearchAreaDocument;
