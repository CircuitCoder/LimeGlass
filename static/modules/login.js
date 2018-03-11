import { tmpl, post } from '../utils.js'

export default Vue.component('Login', async () => {
  const resp = await tmpl('login');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      email: '',
      pass: '',

      innerError: null,
    }),
    methods: {
      async login() {
        this.innerError = '';
        if(this.email === '' || this.pass === '') {
          this.innerError = 'EMPTY';
          return;
        }

        const resp = await post('/account/login', { email: this.email, pass: this.pass });
        const payload = await resp.json();

        if(!payload.success) this.innerError = 'NOUSER';
        else this.$router.push({ path: this.$route.query.redirect || '/' });
      },
      register() {
        this.$router.push({ name: 'register' });
      },
    },
    watch: {
      email() {
        this.innerError = '';
      },
      pass() {
        this.innerError = '';
      }
    },
    computed: {
      error() {
        if(this.innerError !== null) return this.innerError;
        return this.$route.query.error || null;
      },
    },
  };
});
