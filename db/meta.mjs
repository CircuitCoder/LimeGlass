import mongoose from 'mongoose';

const Meta = new mongoose.Schema({
  _id: String,
  content: Object,
});

export default mongoose.model('Meta', Meta);
