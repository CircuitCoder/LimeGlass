import config from './config';
import basedir from './utils/basedir';
import './db'; // Connect

import path from 'path';

import Koa from 'koa';
import KoaRouter from 'koa-router';

const app = new Koa();
const router = new KoaRouter();

app.keys = [ config.secret ];

import KoaBodyparser from 'koa-bodyparser';
import KoaSession from 'koa-session';
import KoaStatic from 'koa-static';
import KoaMount from 'koa-mount';
import KoaSend from 'koa-send';
import KoaEtag from 'koa-etag';
import KoaConditionalGet from 'koa-conditional-get';

app.use(KoaConditionalGet());
app.use(KoaEtag());

app.use(KoaBodyparser());
app.use(KoaSession({
  renew: true,
}, app));

import Account from './handlers/account';
import Admin from './handlers/admin';
import Meta from './handlers/meta';
import Review from './handlers/review';
import Answer from './handlers/answer';
import Notif from './handlers/notif';
import Purchase from './handlers/purchase';

router.use(
  '/account',
  Account.routes(),
  );

router.use(
  '/admin',
  Admin.routes(),
  );

router.use(
  '/meta',
  Meta.routes(),
  );

router.use(
  '/review',
  Review.routes(),
  );

router.use(
  '/answer',
  Answer.routes(),
  );

router.use(
  '/notif',
  Notif.routes(),
  );

router.use(
  '/purchase',
  Purchase.routes(),
  );

app.use(router.routes(), router.allowedMethods());
app.use(KoaStatic(path.resolve(basedir, './static-dest')));
app.use(
  KoaMount('/icons',
    KoaStatic(path.resolve(basedir, './node_modules/material-design-icons/iconfont'))
  )
);

const fallback = new KoaRouter();
fallback.get('*', async ctx => {
  await KoaSend(ctx, 'static-dest/index.html');
});
app.use(fallback.routes(), fallback.allowedMethods());

app.listen(config.port);

console.log(`Listening ${config.port}`);
