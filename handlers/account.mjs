import Mailer from '../utils/mailer';
import Account from '../db/account';
import config from '../config';

import KoaRouter from 'koa-router';
import crypto from 'crypto';
import util from 'util';

const router = new KoaRouter();

router.post('/', async ctx => {
  const account = new Account();
  // TODO: verify incoming request

  if(!ctx.request.body.email.match(/^\S+@\S+\.\S+/)) return ctx.status = 400;

  account.email = ctx.request.body.email;
  account.ciEmail = ctx.request.body.email.toLowerCase();
  account.name = ctx.request.body.name;
  account.school = ctx.request.body.school;
  account.phone = ctx.request.body.phone;
  account.info = ctx.request.body.info;

  const pass = await account.randomPass();

  try {
    await account.save(); // TODO: duplicate
  } catch(e) {
    return ctx.body = { success: false };
  }
  
  await Mailer.send('reg', account.email, {
    name: account.name,
    pass,
  });

  return ctx.body = { success: true };
});

router.post('/login', async ctx => {
  const account = await Account.findOne({ ciEmail: ctx.request.body.email.toLowerCase() });
  if(!account) return ctx.body = { success: false };
  if(!account.validatePass(ctx.request.body.pass)) return ctx.body = { success: false };

  ctx.session.uid = account._id;

  return ctx.body = { success: true };
});

router.post('/pass', async ctx => {
  if(!ctx.session.uid) return ctx.body = { success: false };
  const account = await Account.findById(ctx.session.uid);
  if(!account) return ctx.body = { success: false };

  if(!account.validatePass(ctx.request.body.original)) return ctx.body = { success: false };
  await account.updatePass(ctx.request.body.pass);
  await account.save();

  return ctx.body = { success: true };
});

router.get('/', async ctx => {
  if(!ctx.session.uid) return ctx.body = { success: false };
  const account = await Account.findById(ctx.session.uid, {
    school: 1,
    email: 1,
    name: 1,
    info: 1,
    isAdmin: 1,
    isReviewer: 1,
    rounds: 1,
  });

  for(const r of account.rounds) r.notes = null;

  await account.populate({
    path: 'rounds.reviewers',
    select: 'name email phone',
    model: 'Account',
  }).execPopulate();

  //if(!account) return ctx.body = { success: false };

  return ctx.body = { success: true, payload: account };
});

router.delete('/', async ctx => {
  ctx.session.uid = null;
  return ctx.body = { success: true };
});

router.post('/info', async ctx => {
  if(!ctx.session.uid) return ctx.body = { success: false };

  const result = await Account.findOneAndUpdate({
    _id: ctx.session.uid,
    info: null,
  }, {
    $set: { info: ctx.request.body },
  }, { new: true });

  if(!result) return ctx.body = { success: false };
  else return ctx.body = { success: true };
});

router.post('/recover', async ctx => {
  const token = (await util.promisify(crypto.randomBytes)(16)).toString('hex');
  const result = await Account.findOneAndUpdate({ ciEmail: ctx.request.body.email.toLowerCase() }, {
    token,
    tokenExpire: Date.now() + 10*60*1000,
  });

  if(result) {
    const link = `${config.url}/account/directLogin/${token}/`;
    await Mailer.send('recpass', result.email, {
      name: result.name,
      link,
      token,
    });
  }

  return ctx.body = { success: !!result };
});

router.get('/directLogin/:token', async ctx => {
  if(ctx.params.token.length < 1) return ctx.status = 400;

  const account = await Account.findOneAndUpdate({
    token: ctx.params.token,
    tokenExpire: { $gt: Date.now() },
  }, {
    tokenExpire: 0,
  }).select({
    _id: 1,
  });

  if(account) {
    ctx.session.uid = account._id;
    // TODO: in findOneAndUpdate?
    await account.updatePass(ctx.params.token);
    await account.save();
    ctx.redirect('/');
  } else {
    ctx.redirect('/login?error=TOKEN_FAILED');
  }
});

export default router;
