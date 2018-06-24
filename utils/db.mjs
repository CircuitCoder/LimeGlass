import mongoose from 'mongoose';

export function bulkUpsert(Model, values) {
  return new Promise((resolve, reject) => {
    const bulk = Model.collection.initializeUnorderedBulkOp();
    for(const v of values)
      bulk.find({ _id: v._id }).upsert().updateOne({ $set: v });
    bulk.execute((err, res) => {
      if(err) return reject(err);
      else return resolve(res);
    });
  });
}

export function ObjId(str) {
  return mongoose.Types.ObjectId(str);
}
