import mongoose from 'mongoose';
import config from '../config';

mongoose.connect(config.db);

import Account from './account';

export default {
  Account,
};
