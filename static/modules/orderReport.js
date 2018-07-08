import { tmpl, get, post } from '../utils.js'
import bus from '../bus.js';

const THR = 1000;

export default Vue.component('OrderReport', async () => {
  const resp = await tmpl('orderReport');
  const template = await resp.text();

  return {
    template,
    props: {
      user: Object,
    },
    data: () => ({
      items: null,
      list: null,
      extended: {},
    }),
    created() {
      this.updateItems();
      this.updateList();
    },

    methods: {
      async updateItems() {
        this.items = await (await get('/purchase/items')).json();
      },

      async updateList() {
        this.list = await (await get('/admin/purchase')).json();
      },

      toggleExtend(id) {
        this.$set(this.extended, id, !this.extended[id]);
      },
    },
  };
});
