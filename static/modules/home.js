import { tmpl, get } from '../utils.js'

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
    }),
    methods: {
      async logout() {
        await get('/account', 'delete');
        this.$router.push({ name: 'login' });
      }
    },
  };
});
