import Account from '../db/account';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  const user = await Account.findById(ctx.session.uid);
  if(!user) {
    ctx.status = 403;
  } else {
    ctx.user = user;
    await next();
  }
});

router.get('/', async ctx => {
  return ctx.body = ctx.user.invoice;
});

router.put('/', async ctx => {
  // TODO: validation
  const result = await Account.findOneAndUpdate({
    _id: ctx.session.uid,
    invoice: { $exists: false },
  }, {
    invoice: ctx.request.body,
  });
});

export default router;
