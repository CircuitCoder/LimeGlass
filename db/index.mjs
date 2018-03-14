import mongoose from 'mongoose';
import config from '../config';

import crypto from 'crypto';
import util from 'util';

mongoose.connect(config.db);

import Account from './account';

// Insert default admin

async function initAdmin() {
  const count = await Account.count({ isAdmin: true });
  if(count >= 1) return;

  const admin = new Account();
  const randomName = (await util.promisify(crypto.randomBytes)(6)).toString('base64');
  admin.email = `${randomName}@limeglass`;
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

initAdmin();

export default {
  Account,
};
