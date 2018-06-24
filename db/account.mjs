import mongoose from 'mongoose';

import crypto from 'crypto';
import util from 'util';

import config from '../config';

const Account = new mongoose.Schema({
  // Credentials
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  ciEmail: String, // Case insenstive email
  pass: String,
  salt: String, // We're doing properly this time
  name: String,
  school: String,
  phone: String,

  token: String,
  tokenExpire: Number, // Timestamp

  isAdmin: {
    type: Boolean,
    default: false,
  },

  partialAdmin: {
    type: Boolean,
    default: false,
  },

  isReviewer: {
    type: Boolean,
    default: false,
  },

  info: Object,

  paid: {
    type: Boolean,
    default: false,
  }, // TODO: migrate me

  rounds: [{
    reviewers: [mongoose.Schema.Types.ObjectId], // TODO: index
    notes: String,
    result: {
      type: String,
      enum: ['Pending', 'Accepted', 'Promoted', 'Degraded', 'Halted'],
    },
    questions: [String],
    answers: [String],
    deadline: String, // Timestamp
  }],

  notifs: {
    type: [{
      _id: mongoose.Schema.Types.ObjectId,
      title: String,
      content: String,
      read: {
        type: Boolean,
        default: false,
      },
    }],
    default: [],
  },

  order: {
    type: Object,
    default: {},
  },

}, { minimize: false });

Account.methods.updatePass = async function(plain) {
  this.salt = (await util.promisify(crypto.randomBytes)(16)).toString('hex');
  const hmac = crypto.createHmac('sha256', config.secret);
  hmac.update(plain+this.salt);
  this.pass = hmac.digest('hex');
}

Account.methods.validatePass = function(plain) {
  const hmac = crypto.createHmac('sha256', config.secret);
  hmac.update(plain+this.salt);
  return hmac.digest('hex') === this.pass;
}

Account.methods.randomPass = async function() {
  const pass = (await util.promisify(crypto.randomBytes)(32)).toString('hex');
  await this.updatePass(pass);
  return pass;
}

const model = mongoose.model('Account', Account);

model.collection.createIndex({
  ciEmail: 'hashed',
}, {
  partialFilterExpression: { ciEmail: { $type: 'string' }},
}, (err, result) => {
  if(err) console.error(err);
});

export default model;
