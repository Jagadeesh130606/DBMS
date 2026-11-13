import { Schema } from 'mongoose';
import { logMongoQuery } from './query-logger';

export function mongoLoggerPlugin(schema: Schema) {
  const queryOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findById',
    'findByIdAndUpdate',
    'findByIdAndDelete',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'countDocuments',
  ];

  // Hook pre queries to capture start timestamp
  schema.pre(queryOps as any, function (this: any) {
    this._startTime = performance.now();
  });

  // Hook post queries to compute duration and log
  schema.post(queryOps as any, function (this: any, res: any) {
    try {
      const duration = performance.now() - (this._startTime || performance.now());
      const op = this.op || 'query';
      const collection =
        this.model?.collection?.name ||
        this.collection?.name ||
        schema.get('collection') ||
        'paper_documents';

      const filter = this.getQuery ? this.getQuery() : {};
      const update = this.getUpdate ? this.getUpdate() : undefined;

      let rowCount = 0;
      if (Array.isArray(res)) {
        rowCount = res.length;
      } else if (typeof res === 'number') {
        rowCount = res;
      } else if (res && typeof res === 'object') {
        if ('deletedCount' in res) rowCount = res.deletedCount;
        else if ('modifiedCount' in res) rowCount = res.modifiedCount;
        else if ('matchedCount' in res) rowCount = res.matchedCount;
        else rowCount = 1;
      }

      logMongoQuery({
        collection,
        operation: op,
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        update,
        rowCount,
        executionTimeMs: duration,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.error('[Mongo Logger Error in Post Hook]:', err);
    }
  });

  // Hook Aggregate
  schema.pre('aggregate', function (this: any) {
    this._startTime = performance.now();
  });

  schema.post('aggregate', function (this: any, res: any) {
    try {
      const duration = performance.now() - (this._startTime || performance.now());
      const collection =
        this._model?.collection?.name ||
        schema.get('collection') ||
        'paper_documents';
      const pipeline = typeof this.pipeline === 'function' ? this.pipeline() : [];
      const rowCount = Array.isArray(res) ? res.length : 0;

      logMongoQuery({
        collection,
        operation: 'aggregate',
        pipeline,
        rowCount,
        executionTimeMs: duration,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.error('[Mongo Logger Error in Aggregate Hook]:', err);
    }
  });

  // Hook Save / Create (insertOne)
  schema.pre('save', function (this: any) {
    this._startTime = performance.now();
  });

  schema.post('save', function (this: any, doc: any) {
    try {
      const duration = performance.now() - (this._startTime || performance.now());
      const collection =
        this.constructor?.collection?.name ||
        schema.get('collection') ||
        'paper_documents';
      const docId = doc?.paper_id ?? doc?.author_id ?? doc?.area_id ?? doc?._id;

      const details: Record<string, any> = {};
      if (doc?.title) details.title = doc.title;
      if (doc?.name) details.name = doc.name;
      if (doc?.area_name) details.area_name = doc.area_name;
      if (doc?.sections) details.sections_count = doc.sections.length;
      if (doc?.references) details.references_count = doc.references.length;

      logMongoQuery({
        collection,
        operation: 'insertOne',
        documentId: docId,
        details: Object.keys(details).length > 0 ? details : undefined,
        rowCount: 1,
        executionTimeMs: duration,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.error('[Mongo Logger Error in Save Hook]:', err);
    }
  });

  // Hook insertMany
  schema.pre('insertMany', function (this: any) {
    this._startTime = performance.now();
  });

  schema.post('insertMany', function (this: any, docs: any) {
    try {
      const duration = performance.now() - (this._startTime || performance.now());
      const collection =
        this.collection?.name ||
        schema.get('collection') ||
        'paper_documents';
      const rowCount = Array.isArray(docs) ? docs.length : 1;

      logMongoQuery({
        collection,
        operation: 'insertMany',
        rowCount,
        executionTimeMs: duration,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      console.error('[Mongo Logger Error in insertMany Hook]:', err);
    }
  });
}

export default mongoLoggerPlugin;

