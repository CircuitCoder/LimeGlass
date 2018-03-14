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

router.use(
  '/account',
  Account.routes(),
  Account.allowedMethods(),
  );

router.use(
  '/admin',
  Admin.routes(),
  Admin.allowedMethods(),
  );
app.use(router.routes(), router.allowedMethods());
app.use(KoaStatic(path.resolve(basedir, './static-dest')));

const fallback = new KoaRouter();
fallback.get('*', async ctx => {
  await KoaSend(ctx, 'static-dest/index.html');
});
app.use(fallback.routes(), fallback.allowedMethods());

app.listen(config.port);

console.log(`Listening ${config.port}`);
