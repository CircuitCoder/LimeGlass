import { tmpl, get, post, deepEq, deepClone } from '../utils.js'
import bus from '../bus.js';

function allZero(desc) {
  for(const k in desc)
    for(const sk in desc[k])
      if(desc[k][sk] !== 0)
        return false;
  return true;
}

export default Vue.component('Order', async () => {
  const resp = await tmpl('order');
  const template = await resp.text();

  return {
    template,
    props: {
      user: Object,
    },
    data: () => ({
      items: null,
      order: null,
      pendingOrder: {},
      pendingNotes: {},
      extended: {},
      slot: {},
    }),
    created() {
      this.updateItems();
      this.updateOrder();
    },

    methods: {
      async updateItems() {
        this.items = await (await get('/purchase/items')).json();
      },

      async updateOrder() {
        if(this.$route.name === 'orderAdmin')
          this.order = await (await get(`/admin/purchase/${this.$route.params.id}`)).json();
        else
          this.order = await (await get('/purchase/order')).json();
      },

      extend(id) {
        if(this.$route.name !== 'order') return;
        if(this.extended[id]) return;

        this.$set(this.extended, id, true);
        this.$set(this.slot, id, 0);

        let order;
        let notes;
        if(this.order[id]) {
          order = deepClone(this.order[id].pending);
          notes = deepClone(this.order[id].notes);
        }

        if(!order) {
          order = [];
          for(let i = 0; i < this.items[id].slots.length; ++i) {
            const curArray = new Array(this.items[id].choices.length);
            for(let j = 0; j < this.items[id].choices.length; ++j)
              curArray[j] = 0;
            order.push(curArray);
          }
        }

        if(!notes && this.items[id].notes)
          notes = this.items[id].notes.map(_ => '');

        this.$set(this.pendingOrder, id, order);
        this.$set(this.pendingNotes, id, notes);
      },

      inc(id, ci) {
        this.$set(this.pendingOrder[id][this.slot[id]], ci, this.pendingOrder[id][this.slot[id]][ci]+1);
      },

      dec(id, ci) {
        if(this.pendingOrder[id][this.slot[id]][ci] == 0) return;
        this.$set(this.pendingOrder[id][this.slot[id]], ci, this.pendingOrder[id][this.slot[id]][ci]-1);
      },

      async submit(id) {
        const resp = await post(`/purchase/order/${id}`, {
          pending: this.pendingOrder[id],
          notes: this.pendingNotes[id],
        });
        await this.updateOrder();
        this.$set(this.pendingOrder, id, null);
        this.$set(this.extended, id, false);
      },

      cancel(id) {
        this.$set(this.pendingOrder, id, null);
        this.$set(this.extended, id, false);
      },

      countSum(desc, id) {
        const result = { slots: [], sum: 0 };
        for(let i = 0; i < this.items[id].slots.length; ++i) {
          result.slots[i] = 0;
          if(desc)
            for(let j = 0; j < this.items[id].choices.length; ++j)
              result.slots[i] += desc[i][j] * this.items[id].choices[j].price;
          result.sum += result.slots[i];
        }
        return result;
      },

      async confirm(id, update = true) {
        const resp = await post(`/admin/purchase/${this.$route.params.id}/${id}/confirm`, {}, 'PUT');
        if(update) await this.updateOrder();
      },

      async confirmAll(id) {
        const promises = this.items
          .map((_, id) => id)
          .filter(id => this.status[id] === 'waiting')
          .map(id => this.confirm(id, false));
        await Promise.all(promises);
        this.updateOrder();
      },
    },

    computed: {
      status() {
        if(!this.items) return {};
        if(!this.order) return {};

        const result = {};
        for(let i = 0; i < this.items.length; ++i) {
          if(!this.order[i]) result[i] = 'vacant';
          else if(Object.keys(this.diff[i]).length === 0) {
            if(!this.order[i].confirmed || allZero(this.order[i].confirmed))
              result[i] = 'vacant';
            else
              result[i] = 'ready';
          }
          else result[i] = 'waiting';
        }

        return result;
      },

      sums() {
        const result = {};
        for(let i = 0; i < this.items.length; ++i) {
          result[i] = {
            original: this.countSum(this.order[i] && this.order[i].confirmed ? this.order[i].confirmed : null, i),
            pending: this.countSum(this.order[i] ? this.order[i].pending : null, i),
          };
          if(this.pendingOrder[i])
            result[i].edit = this.countSum(this.pendingOrder[i], i);
        }
        return result;
      },

      diff() {
        if(!this.items) return {};
        if(!this.order) return {};

        const result = {};
        for(let i = 0; i < this.items.length; ++i) {
          if(!this.order[i]) continue;

          const item = this.items[i];
          const itemDiff = {};

          for(let j = 0; j < item.slots.length; ++j) {
            const slotDiff = {};
            for(let k = 0; k < item.choices.length; ++k) {
              let original = 0;
              if(this.order[i].confirmed) original = this.order[i].confirmed[j][k];
              let updated = this.order[i].pending[j][k];
              if(original === updated) continue;
              else slotDiff[k] = { original, updated };
            }
            if(Object.keys(slotDiff).length !== 0) itemDiff[j] = slotDiff;
          }

          result[i] = itemDiff;
        }

        return result;
      },

      digest() {
        if(!this.items) return {};
        if(!this.order) return {};

        const result = {};
        for(let i = 0; i < this.items.length; ++i) {
          if(!this.order[i]) continue;
          if(!this.order[i].confirmed) continue;

          const item = this.items[i];
          const itemDigest = {};


          for(let j = 0; j < item.slots.length; ++j) {
            const slotDigest = {};
            for(let k = 0; k < item.choices.length; ++k)
              if(this.order[i].confirmed[j][k] !== 0)
                slotDigest[k] = this.order[i].confirmed[j][k];

            if(Object.keys(slotDigest).length !== 0) itemDigest[j] = slotDigest;
          }

          result[i] = itemDigest;
        }

        return result;
      },
    },
  };
});
