import { tmpl, get, post } from '../utils.js'
import { STATUS_MAP } from '../consts.js'
import bus from '../bus.js';

const THR = 1000;

export default Vue.component('Review', async () => {
  const resp = await tmpl('review');
  const template = await resp.text();

  return {
    template,
    props: {
      user: Object,
    },
    data: () => ({
      data: null,
      roundPtr: 0,

      STATUS_MAP,
    }),
    async created() {
      await this.update();
    },
    methods: {
      async update() {
        let src;

        const resp = await get(`/review/${this.$route.params.id}`);
        this.data = await resp.json();
        if(this.data.info === null) this.data.info = {};

        const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
            'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
        for(const key of list) {
          if(!this.data.info[key]) this.data.info[key] = '[[ 未填写 ]]';
        }
      },

      async updateField(field) {
        const data = {};
        data[field] = this.round[field];
        const iter = this.roundPtr;

        const resp = await post(`/review/${this.$route.params.id}/${iter}/${field}`, data, 'PUT')
        const payload = await resp.json();

        if(payload.success) {
          // TODO: no alert here
          alert('提交成功');
        } else
          alert('提交失败，请稍后再试');
      }
    },

    computed: {
      round() {
        if(!this.data) return {};
        return this.data.rounds[this.roundPtr];
      },
      privileged() {
        return (this.round.reviewers || []).includes(this.user._id);
      },
    },
    watch: {
      async $route() {
        await this.update();
      },
    },
  };
});
