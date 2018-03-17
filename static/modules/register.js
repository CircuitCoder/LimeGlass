import { tmpl, post } from '../utils.js';
import Info from '../components/info.js';

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

      info: {},

      innerError: null,
      fillingInfo: false,
    }),
    components: {
      info: Info
    },
    created() {
      const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
          'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
      for(const k of list) this.$set(this.info, k, null);
    },
    methods: {
      async gotoInfo() {
        this.innerError = 'HANDLING';
        if(this.email === '' || this.name === '' || this.school === '' || this.phone === '') {
          this.innerError = 'EMPTY';
          return;
        }

        this.fillingInfo = true;
      },

      async register() {
        if(!this.$refs.info.validate()) {
          alert('请检查信息是否填写完整');
          return;
        }

        this.fillingInfo = false;

        const resp = await post('/account', {
          email: this.email,
          school: this.school,
          name: this.name,
          phone: this.phone,
          info: this.info,
        });

        const payload = await resp.json();

        if(!payload.success) this.innerError = 'DUP';
        else this.$router.push({ name: 'login', query: { error: 'REG' }, });
      },

      login() {
        this.$router.push({ name: 'login' });
      },
    },
    watch: {
      email() {
        this.innerError = null;
      },
      name() {
        this.innerError = null;
      },
      school() {
        this.innerError = null;
      },
      phone() {
        this.innerError = null;
      },
    },
    computed: {
      error() {
        if(this.innerError !== null) return this.innerError;
        return this.$route.query.error || null;
      },
    },
  };
});
