import { tmpl, post } from '../utils.js'

export default Vue.component('Home', async () => {
  const resp = await tmpl('home');
  const template = await resp.text();

  return {
    template,
    data: () => ({
    }),
    methods: {
    },
  };
});
