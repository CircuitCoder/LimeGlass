import { tmpl, get, post } from '../utils.js';
import { STATUS_MAP, STATUS_ICON } from '../consts.js';
import bus from '../bus.js';

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

export default Vue.component('Home', async () => {
  const resp = await tmpl('home');
  const template = await resp.text();

  return {
    props: {
      user: {
        type: Object,
        required: true,
      },
    },
    template,
    data: () => ({
      oldpass: null,
      newpass: null,
      reviews: [],
      notifs: [],

      STATUS_MAP,
      STATUS_ICON,
    }),
    created() {
      this.updateReviews();
      this.updateNotifs();
    },
    methods: {
      async updatePass() {
        const resp = await post('/account/pass', {
          original: this.oldpass,
          pass: this.newpass,
        });
        
        const jresp = await resp.json();
        if(jresp.success) {
          alert('修改成功');
          this.oldpass = null;
          this.newpass = null;
        } else {
          alert('请检查原密码');
        }
      },

      async updateReviews() {
        if(!this.user) {
          this.reviews = null;
          return;
        }

        if(this.user.isReviewer) {
          const resp = await get('/review');
          const data = await resp.json();

          this.reviews = data;
        } else this.reviews = null;
      },

      async updateNotifs() {
        if(!this.user) {
          this.notifs = null;
          return;
        }

        const resp = await get('/notif/unread');
        this.notifs = await resp.json();
        this.notifs.reverse();
      },

      md(src) {
        return window.markdownit().render(src);
      },

      formatDate(d) {
        return moment(d).format('MM-DD hh:mm');
      },

      relativeDate(d) {
        return moment(d).fromNow(true)
      },
    },
    watch: {
      user() {
        this.updateReviews();
      },
    }
  };
});
