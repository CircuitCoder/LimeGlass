import Account from '../db/account';
import Mailer from '../utils/mailer';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  const user = await Account.findById(ctx.session.uid).select({
    isReviewer: 1,
    isAdmin: 1,
  });
  if(!user || !(user.isReviewer || user.isAdmin)) {
    ctx.status = 403;
  } else {
    ctx.user = user;
    await next();
  }
});

router.get('/', async ctx => {
  let result = await Account.find({
    rounds: { $elemMatch: {
      reviewers: ctx.session.uid,
    }, },
  }).select({
    name: 1,
    email: 1,
    school: 1,
    phone: 1,
    rounds: 1,
  });

  /*
  for(const r of result)
    r.rounds = r.rounds.filter(r => r.reviewers.map(k => k.toString()).includes(ctx.session.uid));
  */

  return ctx.body = result;
});

router.get('/:id', async ctx => {
  let result = await Account.findOne({
    _id: ctx.params.id,
    rounds: { $elemMatch: {
      reviewers: ctx.session.uid,
    }, },
  }).select({
    name: 1,
    email: 1,
    school: 1,
    phone: 1,
    info: 1,
    rounds: 1,
  });

  // if(!result.rounds) result.rounds = [];
  // result.rounds = result.rounds.filter(r => r.reviewers.includes(ctx.session.uid));

  // Censor ident field
  if(result.info) result.info.ident = '[[ HIDDEN ]]';

  return ctx.body = result;
});

router.put('/:id/:iter(\\d+)/:field(questions|notes|result|deadline)', async ctx => {
  // TODO filter

  const payload = {};
  payload[`rounds.${ctx.params.iter}.${ctx.params.field}`] = ctx.request.body[ctx.params.field];

  const criteria = { _id: ctx.params.id }
  if(!ctx.user.isAdmin) {
    const key = `rounds.${ctx.params.iter}.reviewers`;
    criteria[key] = ctx.session.uid;
  }

  const result = await Account.findOneAndUpdate(criteria, { $set: payload }).select({
    name: 1,
    email: 1,
  });

  if(ctx.params.field === 'questions') {
    await Mailer.send('review', result.email, {
      name: result.name,
      content: `第 ${parseInt(ctx.params.iter, 10)+1} 次面试，学测题目更新。`
    });
  } else if(ctx.params.field === 'deadline') {
    await Mailer.send('review', result.email, {
      name: result.name,
      content: `第 ${parseInt(ctx.params.iter, 10)+1} 次面试，学测推荐提交时限更新。`
    });
  }

  ctx.body = { success: !!result };
});

export default router;
