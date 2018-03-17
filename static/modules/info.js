import { tmpl, get } from '../utils.js'

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
    }),
    async created() {
      let src;

      if(this.$route.query._id !== undefined)
        src = await (await get(`/admin/info/${this.$route.query._id}`)).json();
      else {
        src = this.user.info;
      }

      const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
          'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
      for(const key of list) {
        this.info[key] = src[key];
        if(!this.info[key]) this.info[key] = '[[ 未填写 ]]';
      }
    },
  };
});
