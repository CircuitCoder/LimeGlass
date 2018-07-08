import Account from '../db/account';
import Seat from '../db/seat';
import Mailer from '../utils/mailer';
import { ObjId, bulkUpsert } from '../utils/db';

import mongoose from 'mongoose';

import moment from 'moment';

import KoaRouter from 'koa-router';

import CONFIG from '../config';

const router = new KoaRouter();

router.use(async (ctx, next) => {
  const user = await Account.findById(ctx.session.uid);
  if(!user || !user.isAdmin) {
    ctx.status = 403;
  } else {
    ctx.user = user;
    await next();
  }
});

router.get('/list', async ctx => {
  const list = await Account.find({}, {
    name: 1,
    school: 1,
    email: 1,
    phone: 1,
    info: 1,
    partialAdmin: 1,
    isAdmin: 1,
    isReviewer: 1,
  });

  ctx.body = list;
});

router.get('/info/:id', async ctx => {
  const id = mongoose.Types.ObjectId(ctx.params.id);
  const result = await Account.findById(ctx.params.id, { info: 1 });
  if(result.info)
    return ctx.body = result.info;
  else return ctx.status = 404;
});

router.post('/info/:id', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;
  await Account.findByIdAndUpdate(ctx.params.id, { $set: { info: ctx.request.body } });
  return ctx.body = { success: true };
});

router.get('/review', async ctx => {
  const list = await Account.find({
    isAdmin: { $ne: true },
  }).select({
    _id: 1,
    name: 1,
    rounds: 1,
    isReviewer: 1,
    info: 1,
  });

  for(let i of list) i.info = !!i.info;

  ctx.body = list;
});

router.put('/review/:id/isReviewer', async ctx => {
  const list = await Account.findByIdAndUpdate(ctx.params.id, {
    $set: { isReviewer: ctx.request.body.isReviewer },
  });

  return ctx.body = { success: true };
});

router.post('/review/:id/round', async ctx => {
  const newRound = {
    reviewers: ctx.request.body.reviewers,
    notes: '',
    questions: null,
    answers: null,
    result: 'Pending',
    deadline: moment().add(14, 'days').format('YYYY-MM-DDTHH:mm'),
  };

  const result = await Account.findByIdAndUpdate(ctx.params.id, {
    $push: { rounds: newRound },
  }).select({ name: 1, email: 1 });

  await Mailer.send('review', result.email, {
    name: result.name,
    content: `您的一场新面试已经创建好了，请尽快与面试官联系。`
  });

  return ctx.body = {
    success: true,
    round: newRound,
  };
});

router.delete('/review/:id/round/:iter(\\d+)', async ctx => {
  // Assumes a low frequency operation
  const account = await Account.findById(ctx.params.id);
  if(!account) return ctx.status = 404;

  const round = parseInt(ctx.params.iter, 10);

  account.rounds.splice(round, 1);
  await account.save();
  ctx.body = account.rounds;
});

router.get('/questions', async ctx => {
  const list = await Account.find({
    isAdmin: { $ne: true },
  }).select({
    _id: 1,
    questions: 1,
    name: 1,
    info: 1,
  });

  for(let i of list) i.info = !!i.info;

  ctx.body = list;
});

router.post('/questions/:id', async ctx => {
  await Account.findByIdAndUpdate(ctx.params.id, {
    $set: { questions: ctx.request.body },
  });

  return ctx.body = { success: true };
});

router.delete('/user/:id', async ctx => {
  const deleted = await Account.findByIdAndRemove(ctx.params.id);
  if(!deleted) return ctx.body = { success: false };
  console.log('DELETED: ');
  console.log(JSON.stringify(deleted));

  return ctx.body = { success: true };
});

router.post('/notif', async ctx => {
  const criteria = { isAdmin: false };
  if(ctx.request.body.isReviewer !== null) {
    if(ctx.request.body.isReviewer) criteria.isReviewer = { $eq: true };
    else criteria.isReviewer = { $ne: true };
  }

  if(ctx.request.body.filled)
    criteria.info = { $ne: null }

  if(ctx.request.body.unpaid)
    criteria.paid = { $ne: true }

  const content = ctx.request.body.content;
  const title = ctx.request.body.title;
  const accounts = await Account.find(criteria, {
    _id: 1,
    email: 1,
    name: 1,
  }).lean();

  const ids = accounts.map(e => e._id);

  const resp = await Account.updateMany({ _id: { $in: ids }}, {
    $push: {
      notifs: {
        _id: mongoose.Types.ObjectId(),
        title,
        content,
        read: false,
      }
    }
  });

  // Defers all
  for(const a of accounts)
    Mailer.send('notif', a.email, {
      title,
      name: a.name,
    });

  return ctx.body = { count: resp.nModified };
});

router.put('/admin/:id', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;
  await Account.findByIdAndUpdate(ctx.params.id, {
    $set: {
      isAdmin: ctx.request.body.isAdmin,
      partialAdmin: true,
    },
  });

  return ctx.body = { success: true };
});

// Seats
router.get('/seats', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;
  return ctx.body = await Seat.find().sort({ _id: 1 });
});

router.put('/seats', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;
  await bulkUpsert(Seat, ctx.request.body);
  return ctx.body = { success: true };
});

router.put('/seat/:id(\\d+)', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;
  const original = await Seat.findByIdAndUpdate(
    parseInt(ctx.params.id, 10),
    { $set: { assigned: ctx.request.body.user }},
    { multi: false, new: false },
  );

  if(original.assigned) {
    const user = await Account.findById(original.assigned);
    Mailer.send('seat', user.email, {
      name: user.name,
    });
  }

  const user = await Account.findById(ctx.request.body.user);
  Mailer.send('seat', user.email, {
    name: user.name,
  });

  return ctx.body = { success: true };
});

router.delete('/seat/:id', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;

  const original = await Seat.findByIdAndUpdate(
    parseInt(ctx.params.id, 10),
    { $unset: { assigned: 1 }},
    { multi: false, new: false }
  );

  if(original.assigned) {
    const user = await Account.findById(original.assigned);
    Mailer.send('seat', user.email, {
      name: user.name,
    });
  }

  return ctx.body = { success: true };
});

router.get('/purchase', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;

  const accounts = await Account.find({ order: { $exists: true }}).select('order name _id');

  const result = new Array(CONFIG.items.length);
  CONFIG.items.forEach((e, i) => {
    result[i] = {
      stat: new Array(e.slots ? e.slots.length : 1),
      noted: [],
    };

    for(let j = 0; j<result[i].stat.length; ++j)
      result[i].stat[j] = new Array(e.choices.length).fill(0);

  });

  for(const a of accounts) {
    if(!a.order) continue;
    for(const i in a.order) {
      if(a.order[i].notes && a.order[i].notes.some(e => !!e))
        result[i].noted.push({
          _id: a._id,
          name: a.name,
        });

      if(!a.order[i].confirmed) continue;

      const list = a.order[i].confirmed;
      const slot = result[i].stat;

      for(let i = 0; i < slot.length; ++i)
        if(i in list)
          for(let j = 0; j < slot[i].length; ++j)
            if(j in list[i])
              slot[i][j] += parseInt(list[i][j], 10);
    }
  }

  return ctx.body = result;
});

router.get('/purchase/:uid', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;

  const account = await Account.findById(ctx.params.uid).select('order');
  if(!account.order) return ctx.body = {};
  return ctx.body = account.order;
});

router.post('/purchase/:uid/:item(\\d+)', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;

  // Build update criteria
  const update = {};
  update[`order.${ctx.params.item}.pending`] = ctx.request.body.pending;
  update[`order.${ctx.params.item}.notes`] = ctx.request.body.notes;

  await Account.findByIdAndUpdate(ctx.params.uid, { $set: update });

  ctx.body = { success: true };
});

router.put('/purchase/:uid/:item(\\d+)/confirm', async ctx => {
  if(ctx.user.partialAdmin) return ctx.status = 403;

  const target = await Account.findById(ctx.params.uid).select('order');

  const updateToken = {};
  const itemId = parseInt(ctx.params.item, 10);
  updateToken[`order.${itemId}.confirmed`] = target.order[itemId].pending;

  await Account.findByIdAndUpdate(ctx.params.uid, {
    $set: updateToken,
  });

  return ctx.body = { success: true };
});

export default router;
