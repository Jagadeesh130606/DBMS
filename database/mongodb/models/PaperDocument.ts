import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISection {
  heading: string;
  content: string;
}

export interface IReference {
  title: string;
  authors: string[];
  year: number;
  doi?: string;
}

export interface IPaperMetadata {
  language: string;
  document_type: string;
  publisher?: string;
  page_count?: number;
  peer_reviewed?: boolean;
}

export interface IPaperDocument extends Document {
  paper_id: number;
  full_text: string;
  sections: ISection[];
  references: IReference[];
  keywords: string[];
  metadata: IPaperMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<ISection>({
  heading: { type: String, required: true },
  content: { type: String, required: true },
}, { _id: false });

const ReferenceSchema = new Schema<IReference>({
  title: { type: String, required: true },
  authors: [{ type: String, required: true }],
  year: { type: Number, required: true },
  doi: { type: String },
}, { _id: false });

const MetadataSchema = new Schema<IPaperMetadata>({
  language: { type: String, default: 'English' },
  document_type: { type: String, default: 'Research Article' },
  publisher: { type: String },
  page_count: { type: Number },
  peer_reviewed: { type: Boolean, default: true },
}, { _id: false });

const PaperDocumentSchema = new Schema<IPaperDocument>({
  paper_id: { 
    type: Number, 
    required: true, 
    unique: true, 
    index: true 
  },
  full_text: { 
    type: String, 
    required: true 
  },
  sections: [SectionSchema],
  references: [ReferenceSchema],
  keywords: [{ 
    type: String, 
    index: true 
  }],
  metadata: { 
    type: MetadataSchema, 
    default: () => ({}) 
  },
}, {
  timestamps: true,
  collection: 'paper_documents',
});

// Compound and text indexes for rapid MongoDB retrieval and aggregation
PaperDocumentSchema.index({ keywords: 1, 'metadata.document_type': 1 });
PaperDocumentSchema.index({ 'references.year': 1 });
PaperDocumentSchema.index({ full_text: 'text', keywords: 'text' });

export const PaperDocument: Model<IPaperDocument> =
  mongoose.models.PaperDocument ||
  mongoose.model<IPaperDocument>('PaperDocument', PaperDocumentSchema);

export default PaperDocument;

