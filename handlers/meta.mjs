import Info from '../utils/info';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.get('/info', async ctx => {
  ctx.body = Info.load().get();
});
