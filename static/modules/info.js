import { tmpl, get, post } from '../utils.js'
import bus from '../bus.js';

const THR = 1000;

export default Vue.component('Info', async () => {
  const resp = await tmpl('info');
  const template = await resp.text();

  return {
    template,
    props: {
      user: Object,
    },
    data: () => ({
      info: {},
      edit: false,
      admin: false,
    }),
    async created() {
      await this.update();
    },
    methods: {
      async submit() {
        const resp = await post('/account/info', this.info);
        const jresp = await resp.json();
        await bus.trigger('refresh');
        this.$router.push({ name: 'home' });
      },

      async adminSubmit() {
        const resp = await post(`/admin/info/${this.$route.query._id}`, this.info);
        const jresp = await resp.json();
        alert('更新成功');
      },

      async update() {
        let src;

        if(this.$route.query._id !== undefined) {
          const resp = await get(`/admin/info/${this.$route.query._id}`);
          if(resp.status === 404)
            src = null;
          else
            src = await resp.json();
        } else {
          src = this.user.info;
        }

        if(this.$route.query.edit) {
          this.edit = true;
          if(!src) src={};
        }

        if(this.$route.query.admin) {
          this.admin = true;
          if(!src) src={};
        }

        this.info = {};

        const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
            'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
        for(const key of list) {
          this.info[key] = src[key];
          if(!this.admin && !this.edit) if(!this.info[key]) this.info[key] = '[[ 未填写 ]]';
        }
      },
    },
    watch: {
      async $route() {
        await this.update();
      },
    },
  };
});
