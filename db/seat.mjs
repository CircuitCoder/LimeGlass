import mongoose from 'mongoose';

const Seat = new mongoose.Schema({
  _id: Number,
  title: String,
  name: String,
  tags: [String],

  assigned: mongoose.Schema.Types.ObjectId,
});

const model = mongoose.model('Seat', Seat);

export default model;
