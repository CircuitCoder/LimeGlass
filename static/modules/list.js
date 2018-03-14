import { tmpl, get } from '../utils.js'

export default Vue.component('List', async () => {
  const resp = await tmpl('list');
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
      list: null
    }),
    created() {
      this.update();
    },
    methods: {
      async update() {
        const resp = await get('/admin/list');
        this.list = await resp.json();
      },
    },
  };
});
