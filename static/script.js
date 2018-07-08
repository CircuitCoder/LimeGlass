import { get } from './utils.js';
import bus from '/bus.js';

import Login from './modules/login.js';
import Register from './modules/register.js';
import Home from './modules/home.js';
import Info from './modules/info.js';
import List from './modules/list.js';
import Send from './modules/send.js';
import Reviewers from './modules/reviewers.js';
import Review from './modules/review.js';
import Answer from './modules/answer.js';
import Seats from './modules/seats.js';
import Order from './modules/order.js';
import OrderReport from './modules/orderReport.js';

moment.locale('en');
moment.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: '~s',
    ss: '%ds',
    m: '1m',
    mm: '%dm',
    h: '1h',
    hh: '%dh',
    d: '1d',
    dd: '%dd',
    M: '1M',
    MM: '%dM',
    y: '1y',
    yy: '%dy',
  },
});

moment.relativeTimeThreshold('ss', 0);

let instance;

const routes = [
  { path: '/', component: Home, name: 'home', beforeEnter: (to, from, next) => {
    if(!instance.user.info) return next({ name: 'info', query: { edit: true } });
    else return next();
  } },
  { path: '/login', component: Login, name: 'login', meta: { noAuth: true }, },
  { path: '/register', component: Register, name: 'register', meta: { noAuth: true }, },
  { path: '/info', component: Info, name: 'info', },

  { path: '/list', component: List, name: 'list', },
  { path: '/send', component: Send, name: 'send', },
  { path: '/reviewers', component: Reviewers, name: 'reviewers', meta: { fullscreen: true }, },
  { path: '/reviewing/:id', component: Review, name: 'review', },
  { path: '/answer/:iter(\\d+)', component: Answer, name: 'answer', },
  { path: '/seats', component: Seats, name: 'seats', },
  { path: '/order', component: Order, name: 'order', },
  { path: '/orderAdmin/:id', component: Order, name: 'orderAdmin', }, // Reuse the Order component
  { path: '/orderReport', component: OrderReport, name: 'orderReport', },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

router.beforeEach((to, from, next) => {
  // Wait for one tick
  setTimeout(() => {
    if(instance && instance.user) return next();

    const refresher = instance.refresh();
    if(to.matched.every(e => e.meta.noAuth)) return next();

    refresher.then(result => {
      if(result) {
        return next();
      } else {
        next({
          name: 'login',
          query: {
            redirect: to.path
          },
        });
      }
    });
  });
});

const desc = {
  data: {
    ready: false,
    online: false,

    user: null,
    floatingNav: false,
  },
  router,
  created() {
    bus.on('refresh', 'primary', () => this.refresh());
  },
  methods: {
    async refresh() {
      const resp = await get('/account');
      const jresp = await resp.json();
      if(jresp.success) {
        this.user = jresp.payload;
        return true;
      } else {
        this.user = null;
        return false;
      }
    },
    registered() {
      this.defaultError = 'REG';
      this.$router.push({ name: 'login' });
    },
    async logout() {
      const resp = await get('/account', 'delete');
      await bus.trigger('refresh');
      this.$router.push({ name: 'login' });
    },
    checkScroll() {
      this.floatingNav = window.scrollY !== 0;
    },
  }
};


export default function init() {
  instance = new Vue(desc);
  instance.$mount('#app');

  window.addEventListener('scroll', () => {
    instance && instance.checkScroll();
  });

  document.body.addEventListener('resize', () => {
    instance && instance.checkScroll();
  });
}

window.init = init;
