import { tmpl, get, post } from '../utils.js'
import { STATUS_MAP } from '../consts.js'
import bus from '../bus.js';

const THR = 1000;

export default Vue.component('Answer', async () => {
  const resp = await tmpl('answer');
  const template = await resp.text();

  return {
    template,
    props: {
      user: Object,
    },
    data: () => ({
      data: null,
      ready: false,

      STATUS_MAP,
    }),
    created() {
      this.update()
    },

    methods: {
      update() {
        if(this.round.answers) {
          this.ready = true;
        } else if(this.round.questions) {
          this.round.answers = this.round.questions.map(e => '');
        }
      },

      async submit() {
        if(this.round.answers.includes(''))
          if(!confirm('您有未作答的题目，是否继续?')) return;
        const resp = await post(
          `/answer/${this.$route.params.iter}/answers`,
          { answers: this.round.answers },
          'PUT'
        );

        const payload = await resp.json();
        if(payload.success) {
          this.ready = true;
          alert('提交成功!');
        } else {
          alert('提交失败，请稍后再试!');
        }
      },
    },

    computed: {
      round() {
        if(!this.user) return null;
        return this.user.rounds[parseInt(this.$route.params.iter, 10)];
      },
    },

    watch: {
      $route() {
        this.update();
      },
    },
  };
});
