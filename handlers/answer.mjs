import Account from '../db/account';
import TG from '../utils/tg';

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
  const criteria = {
    _id: ctx.session.uid,
  };
  criteria[`rounds.${ctx.params.iter}.answers`] = null;

  const payload = {};
  payload[`rounds.${ctx.params.iter}.answers`] = ctx.request.body.answers;

  const result = await Account.findOneAndUpdate(criteria, { $set: payload });
  if(result)
    TG.answer(result); // Defered

  ctx.body = { success: !!result };
});

export default router;
