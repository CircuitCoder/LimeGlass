import { get } from './utils.js';

import Login from './modules/login.js';
import Register from './modules/register.js';
import Home from './modules/home.js';
import Info from './modules/info.js';

let instance;

const routes = [
  { path: '/', component: Home, name: 'home', beforeEnter: (to, from, next) => {
    if(!instance.user.info) return next({ name: 'info' });
    else return next();
  } },
  { path: '/login', component: Login, name: 'login', meta: { noAuth: true }, },
  { path: '/register', component: Register, name: 'register', meta: { noAuth: true }, },
  { path: '/info', component: Info, name: 'info', },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

router.beforeEach((to, from, next) => {
  if(instance && instance.user) return next();
  if(to.matched.every(e => e.meta.noAuth)) return next();
  get('/account')
    .then(resp => resp.json())
    .then(payload => {
      if(payload.success) {
        instance.user = payload.payload;
        return next();
      }
      else next({
        name: 'login',
        query: {
          redirect: to.path
        },
      });
    });
});

const desc = {
  data: {
    ready: false,
    online: false,

    user: null,
  },
  router,
  methods: {
    registered() {
      this.defaultError = 'REG';
      this.$router.push({ name: 'login' });
    },
    online() {
    },
  }
};


function init() {
  instance = new Vue(desc);
  instance.$mount('#app');
}

window.init = init;
