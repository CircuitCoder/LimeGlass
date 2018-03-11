import Login from './modules/login.js';

const routes = [
  { path: '/', component: Login },
];

const router = new VueRouter({
  routes,
  mode: 'history',
});

const desc = {
  data: {
    ready: false,
    online: false,
  },
  router,
};


function init() {
  const instance = new Vue(desc);
  instance.$mount('#app');
}

window.init = init;
