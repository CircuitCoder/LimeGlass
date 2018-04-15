import Account from '../db/account';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  if(!ctx.session.uid) {
    ctx.status = 403;
  } else {
    await next();
  }
});

router.put('/:iter(\\d+)/answers', async ctx => {
  // TODO filter

  const payload = {};
  payload[`rounds.${ctx.params.iter}.answers`] = ctx.request.body.answers;

  console.log(payload);
  console.log(criteria);

  const result = await Account.findOneAndUpdate(criteria, { $set: payload });
  ctx.body = { success: !!result };
});

export default router;
