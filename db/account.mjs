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
  pass: String,
  salt: String, // We're doing properly this time
  name: String,
  school: String,
  phone: String,

  isAdmin: {
    type: Boolean,
    default: false,
  },

  info: Object,
});

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

export default mongoose.model('Account', Account);
