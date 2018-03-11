import { tmpl, post } from '../utils.js'

export default Vue.component('Login', async () => {
  const resp = await tmpl('login');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      email: '',
      pass: '',

      error: null,
    }),
    methods: {
      async login() {
        this.error = null;
        if(this.email === '' || this.pass === '') {
          this.error = 'EMPTY';
          return;
        }

        const resp = await post('/account/login', { email: this.email, pass: this.pass });
        const payload = await resp.json();

        if(!payload.success) this.error = 'NOUSER';
        else this.$emit('online');
      },
    },
    watch: {
      email() {
        this.error = null;
      },
      pass() {
        this.error = null;
      }
    }
  };
});
