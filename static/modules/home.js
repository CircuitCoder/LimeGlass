import { tmpl, get, post } from '../utils.js';
import { STATUS_MAP, STATUS_ICON } from '../consts.js';
import bus from '../bus.js';

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

      STATUS_MAP,
      STATUS_ICON,
    }),
    created() {
      this.updateReviews();
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

      async logout() {
        const resp = await get('/account', 'delete');
        await bus.trigger('refresh');
        this.$router.push({ name: 'login' });
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
    },
    watch: {
      user() {
        this.updateReviews();
      },
    }
  };
});
