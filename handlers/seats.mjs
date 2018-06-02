import Account from '../db/account';
import Seat from '../db/seat';

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.use(async ctx => {
  ctx.user = await Account.find(ctx.session.uid);
});

router.get('/users', async ctx => {
  if(ctx.user.isAdmin)
    return ctx.body = await Account.find({}, { name: 1, school: 1 });
  else if(ctx.isReviewer)
    return ctx.body = await Account.find({ rounds: { $elemMatch: { reviewers: ctx.user._id, result: 'Accepted' }}});
  else return ctx.status = 403;
});

export default router;
