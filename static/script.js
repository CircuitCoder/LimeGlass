import { get } from './utils.js';
import bus from '/bus.js';

import Login from './modules/login.js';
import Register from './modules/register.js';
import Home from './modules/home.js';
import Info from './modules/info.js';
import List from './modules/list.js';
import Reviewers from './modules/reviewers.js';
import Review from './modules/review.js';

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
  { path: '/reviewers', component: Reviewers, name: 'reviewers', },
  { path: '/reviewing/:id', component: Review, name: 'review', },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

router.beforeEach((to, from, next) => {
  if(instance && instance.user) return next();
  if(to.matched.every(e => e.meta.noAuth)) return next();

  // Wait for one tick
  setTimeout(() =>
    instance.refresh().then(result => {
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
    }));
});

const desc = {
  data: {
    ready: false,
    online: false,

    user: null,
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
  }
};


export default function init() {
  instance = new Vue(desc);
  instance.$mount('#app');
}

window.init = init;
