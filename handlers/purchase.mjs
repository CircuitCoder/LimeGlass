import Meta from '../db/meta';
import Account from '../db/account';

import KoaRouter from 'koa-router';

import CONFIG from '../config';

import { ObjId } from '../utils/db';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  const user = await Account.findById(ctx.session.uid);
  if(!user) {
    ctx.status = 403;
  } else {
    await next();
  }
});

router.get('/items', async ctx => {
  ctx.body = CONFIG.items;
});

router.post('/order/:id(\\d+)', async ctx => {
  // Build update criteria
  const update = {};
  update[`order.${ctx.params.id}.pending`] = ctx.request.body.pending;
  update[`order.${ctx.params.id}.notes`] = ctx.request.body.notes;

  await Account.findByIdAndUpdate(ctx.session.uid, { $set: update });

  ctx.body = { success: true };
});

router.get('/order', async ctx => {
  const account = await Account.findById(ctx.session.uid).select('order');
  if(!account.order) return ctx.body = {};
  return ctx.body = account.order;
});

export default router;
