import config from './config';
import './db'; // Connect

import Koa from 'koa';
import KoaRouter from 'koa-router';

const app = new Koa();
const router = new KoaRouter();

app.keys = [ config.secret ];

import KoaBodyparser from 'koa-bodyparser';
import KoaSession from 'koa-session';

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
app.listen(config.port);

console.log(`Listening ${config.port}`);
