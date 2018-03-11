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

app.use(KoaBodyparser());
app.use(KoaSession({
  renew: true,
}, app));

import Account from './handlers/account';

router.use(
  '/account',
  Account.routes(),
  Account.allowedMethods(),
  );

app.use(router.routes(), router.allowedMethods());
app.use(KoaStatic(path.resolve(basedir, './static')));
app.listen(config.port);

console.log(`Listening ${config.port}`);
