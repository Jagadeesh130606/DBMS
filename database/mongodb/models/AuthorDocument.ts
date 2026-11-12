import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthorMetrics {
  h_index: number;
  total_citations: number;
  total_publications: number;
}

export interface IAuthorExternalProfiles {
  google_scholar?: string;
  orcid?: string;
  dblp?: string;
  github?: string;
}

export interface IAuthorDocument extends Document {
  author_id: number;
  name: string;
  affiliation: string;
  email: string;
  bio: string;
  research_interests: string[];
  co_author_ids: number[];
  metrics: IAuthorMetrics;
  external_profiles: IAuthorExternalProfiles;
  createdAt: Date;
  updatedAt: Date;
}

const AuthorMetricsSchema = new Schema<IAuthorMetrics>({
  h_index: { type: Number, default: 0 },
  total_citations: { type: Number, default: 0 },
  total_publications: { type: Number, default: 0 },
}, { _id: false });

const ExternalProfilesSchema = new Schema<IAuthorExternalProfiles>({
  google_scholar: { type: String },
  orcid: { type: String },
  dblp: { type: String },
  github: { type: String },
}, { _id: false });

const AuthorDocumentSchema = new Schema<IAuthorDocument>({
  author_id: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  affiliation: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  bio: {
    type: String,
    default: '',
  },
  research_interests: [{
    type: String,
  }],
  co_author_ids: [{
    type: Number,
  }],
  metrics: {
    type: AuthorMetricsSchema,
    default: () => ({ h_index: 0, total_citations: 0, total_publications: 0 }),
  },
  external_profiles: {
    type: ExternalProfilesSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
  collection: 'author_documents',
});

// Indexes for author exploration and aggregations
AuthorDocumentSchema.index({ 'metrics.total_citations': -1, 'metrics.h_index': -1 });
AuthorDocumentSchema.index({ research_interests: 1 });
AuthorDocumentSchema.index({ name: 'text', bio: 'text', affiliation: 'text' });

export const AuthorDocument: Model<IAuthorDocument> =
  mongoose.models.AuthorDocument ||
  mongoose.model<IAuthorDocument>('AuthorDocument', AuthorDocumentSchema);

export default AuthorDocument;
