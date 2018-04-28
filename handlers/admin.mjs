import Account from '../db/account';
import Mailer from '../utils/mailer';

import mongoose from 'mongoose';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  const user = await Account.findById(ctx.session.uid);
  if(!user || !user.isAdmin) {
    ctx.status = 403;
  } else {
    await next();
  }
});

router.get('/list', async ctx => {
  const list = await Account.find({}, {
    name: 1,
    school: 1,
    email: 1,
    phone: 1,
    info: 1,
    isReviewer: 1,
  });

  ctx.body = list;
});

router.get('/info/:id', async ctx => {
  const id = mongoose.Types.ObjectId(ctx.params.id);
  const result = await Account.findById(ctx.params.id, { info: 1 });
  if(result.info)
    return ctx.body = result.info;
  else return ctx.status = 404;
});

router.post('/info/:id', async ctx => {
  await Account.findByIdAndUpdate(ctx.params.id, { $set: { info: ctx.request.body } });
  return ctx.body = { success: true };
});

router.get('/review', async ctx => {
  const list = await Account.find({
    isAdmin: { $ne: true },
  }).select({
    _id: 1,
    name: 1,
    rounds: 1,
    isReviewer: 1,
    info: 1,
  });

  for(let i of list) i.info = !!i.info;

  ctx.body = list;
});

router.put('/review/:id/isReviewer', async ctx => {
  const list = await Account.findByIdAndUpdate(ctx.params.id, {
    $set: { isReviewer: ctx.request.body.isReviewer },
  });

  return ctx.body = { success: true };
});

router.post('/review/:id/round', async ctx => {
  const newRound = {
    reviewers: ctx.request.body.reviewers,
    notes: '',
    questions: null,
    answers: null,
    result: 'Pending',
  };

  const result = await Account.findByIdAndUpdate(ctx.params.id, {
    $push: { rounds: newRound },
  }).select({ name: 1, email: 1 });

  await Mailer.send('review', result.email, {
    name: result.name,
    content: `您的一场新面试已经创建好了，请尽快与面试官联系。`
  });

  return ctx.body = {
    success: true,
    round: newRound,
  };
});

router.get('/questions', async ctx => {
  const list = await Account.find({
    isAdmin: { $ne: true },
  }).select({
    _id: 1,
    questions: 1,
    name: 1,
    info: 1,
  });

  for(let i of list) i.info = !!i.info;

  ctx.body = list;
});

router.post('/questions/:id', async ctx => {
  await Account.findByIdAndUpdate(ctx.params.id, {
    $set: { questions: ctx.request.body },
  });

  return ctx.body = { success: true };
});

export default router;
