import Account from '../db/account';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.get('/list', async ctx => {
  const rawlist = await Account.find({
    isAdmin: { $ne: true },
  }, {
    name: 1,
    school: 1,
    email: 1,
    phone: 1,
    info: 1,
  });

  const list = rawlist.map(e => {
    e.info = !!e.info;
    return e;
  });

  ctx.body = list;
});

export default router;
