import { tmpl, get, post } from '../utils.js'

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
    }),
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
        await get('/account', 'delete');
        this.$emit('refresh');
        this.$router.push({ name: 'login' });
      }
    },
  };
});
