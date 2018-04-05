import Meta from '../db/meta';
import Account from '../db/account';

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

router.get('/:id', async ctx => {
  let result = await Meta.findById(ctx.params.id);
  if(!result) return ctx.status = 404;
  return ctx.body = result.content;
});

router.put('/:id', async ctx => {
  await Meta.findByIdAndUpdate(ctx.params.id, {
    $set: { content: ctx.request.body },
  }, { upsert: true });
  ctx.body = { success: true };
});

export default router;
