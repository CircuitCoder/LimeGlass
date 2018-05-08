import Account from '../db/account';
import Mailer from '../utils/mailer';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  if(!ctx.session.uid) {
    ctx.status = 403;
  } else {
    await next();
  }
});

router.get('/unread', async ctx => {
  const account = await Account.findById(ctx.session.uid, { notifs: 1 }).lean();
  ctx.body = account.notifs.filter(e => !e.read);
});

router.get('/full', async ctx => {
  const account = await Account.findById(ctx.session.uid, { notifs: 1 }).lean();
  ctx.body = account.notifs;
});

export default router;
