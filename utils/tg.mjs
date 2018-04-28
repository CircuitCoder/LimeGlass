import request from 'request-promise-native';
import Handlebars from 'handlebars';
import CONFIG from '../config';

function send(target, content) {
  return request.post({
    url: `${CONFIG.tgBase}/bot${CONFIG.tgBot}/sendMessage`,
    body: {
      chat_id: target,
      text: content,
      parse_mode: 'Markdown',
    },
    json: true,
  });
}

function broadcast(content) {
  const p = CONFIG.tgUpdate.map(id => send(id, content));
  return Promise.all(p);
}

const ANSWER_TMPL = Handlebars.compile(`
*New answer*
From user *{{ name }}*
[Manage](${CONFIG.url}/reviewers?_id:{{ id }})
`);

export async function answer(user) {
  await broadcast(ANSWER_TMPL({
    name: user.name,
    id: user._id,
  }));
}

export default {
  answer
};
