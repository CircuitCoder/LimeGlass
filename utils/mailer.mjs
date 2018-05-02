import Handlebars from 'handlebars';
import Nodemailer from 'nodemailer';
import Juice from 'juice';

import basedir from './basedir';

import config from '../config';

import fs from 'fs';
import path from 'path';
import util from 'util';

const tmpls = {
  reg: '{{ config.name }} - 注册确认',
  recpass: '{{ config.name }} - 忘记密码',
  review: '{{ config.name }} - 面试状态更新',
  notif: '{{ config.name }} - 新通知',
};

const transport = Nodemailer.createTransport(config.mail.smtp);

async function send(tmpl, to, args) {
  if(to.match(/@limeglass$/)) return;

  const data = Object.assign(args, { config });

  // TODO: stash them
  const title = Handlebars.compile(tmpls[tmpl])(data);
  Object.assign(data, { meta: { title }});

  const raw = await util.promisify(fs.readFile)(path.resolve(basedir, `mails/${tmpl}.html`));
  const content = raw.toString('utf-8');
  const body = Handlebars.compile(content)(data);
  const applied = Juice(body);

  const mail = {
    from: config.mail.addr,
    to,
    subject: title,
    html: applied,
  };

  return await transport.sendMail(mail);
}

export default {
  send,
};
