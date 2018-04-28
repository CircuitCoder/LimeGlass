import mongoose from 'mongoose';
import config from '../config';

import crypto from 'crypto';
import util from 'util';

mongoose.connect(config.db);

import Account from './account';

async function upgradeDB() {
  // TODO: use versioning
  
  // Set case insensitive email
  const users = await Account.find();
  for(const u of users) {
    if(!Array.isArray(u.rounds)) {
      console.log(u._id, u.rounds);
      u.rounds = [];
    } else for(const r of u.rounds) {
      if(!Array.isArray(u.questions)) u.questions = u.questions.split('\n');
      if(!Array.isArray(u.answers)) u.answers = u.answers.split('\n');
    }

    if(!u.ciEmail)
      u.ciEmail = u.email.toLowerCase();
    await u.save();
  }
}

// Insert default admin

async function initAdmin() {
  const count = await Account.count({ isAdmin: true });
  if(count >= 1) return;

  const admin = new Account();
  const randomName = (await util.promisify(crypto.randomBytes)(6)).toString('base64');
  admin.email = `${randomName}@limeglass`;
  admin.ciEmail = `${randomName}@limeglass`.toLowerCase();
  admin.name = 'Admin';
  admin.school = 'LimeGlass';
  admin.phone = '00000000';
  const pass = await admin.randomPass();
  admin.isAdmin = true;
  admin.info = { admin: true }; // TODO: why doesn't empty ones work?

  await admin.save();

  console.log('Default admin login:');
  console.log(`Email: ${admin.email}`);
  console.log(`Pass: ${pass}`);
  console.log('ATTENTION: This will only show up once.');
}

async function init() {
  await upgradeDB();
  await initAdmin();
}

init().catch(e => console.error(e));

export default {
  Account,
};
