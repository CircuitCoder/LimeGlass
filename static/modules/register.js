import { tmpl, post } from '../utils.js'

export default Vue.component('Register', async () => {
  const resp = await tmpl('register');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      email: '',
      school: '',
      name: '',
      phone: '',

      error: null,
    }),
    methods: {
      async register() {
        this.error = 'HANDLING';
        if(this.email === '' || this.name === '' || this.school === '' || this.phone === '') {
          this.error = 'EMPTY';
          return;
        }

        const resp = await post('/account', {
          email: this.email,
          school: this.school,
          name: this.name,
          phone: this.phone,
        });

        const payload = await resp.json();

        if(!payload.success) this.error = 'DUP';
        else this.$router.push({ name: 'login', query: { error: 'REG' }, });
      },

      login() {
        this.$router.push({ name: 'login' });
      },
    },
    watch: {
      email() {
        this.error = null;
      },
      name() {
        this.error = null;
      },
      school() {
        this.error = null;
      },
      phone() {
        this.error = null;
      },
    }
  };
});
