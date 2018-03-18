import Mailer from '../utils/mailer';
import Account from '../db/account';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.post('/', async ctx => {
  const account = new Account();
  // TODO: verify incoming request
  account.email = ctx.request.body.email;
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
  const account = await Account.findOne({ email: ctx.request.body.email });
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
  }).lean();

  //if(!account) return ctx.body = { success: false };

  return ctx.body = { success: true, payload: account };
});

router.delete('/', async ctx => {
  ctx.session.uid = null;
  return ctx.body = { success: true };
});

router.post('/info', async ctx => {
  if(!ctx.session.uid) return ctx.body = { success: false };

  await Account.findByIdAndUpdate(ctx.session.uid, {
    $set: {
      info: ctx.request.body,
    }
  });
  
  return ctx.body = { success: true };
});

export default router;
