import { tmpl, get, post } from '../utils.js'

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
    }),
    async created() {
      let src;

      if(this.$route.query._id !== undefined)
        src = await (await get(`/admin/info/${this.$route.query._id}`)).json();
      else {
        src = this.user.info;
      }

      if(this.$route.query.edit) {
        this.edit = true;
        if(!src) src={};
      }

      const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
          'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
      for(const key of list) {
        this.info[key] = src[key];
        if(!this.edit) if(!this.info[key]) this.info[key] = '[[ 未填写 ]]';
      }
    },
    methods: {
      async submit() {
        const resp = await post('/account/info', this.info);
        const jresp = await resp.json();
        console.log(jresp);
      },
    },
  };
});
