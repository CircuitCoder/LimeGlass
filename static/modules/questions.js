import { tmpl, get, post } from '../utils.js'

const DEBOUNCE = 1000

export default Vue.component('Questions', async () => {
  const resp = await tmpl('questions');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      questions: [],
      list: [],

      settingQuestions: false,
      debouncer: null,
      ready: false,

      filter: '',
      filterInfo: false,
      filterAssigned: false,
      questionFilter: '',

      pendingDel: null,
    }),

    async created() {
      try {
        const resp = await get('/meta/questions');
        this.questions = await resp.json();
      } catch(e) {} // Silently ignores

      if(this.questions.length === 0) this.settingQuestions = true;
      this.$nextTick(() => this.ready = true);

      const resp = await get('/admin/questions');
      this.list = await resp.json();
    },

    methods: {
      pushNew() {
        this.questions.push("");
        this.$nextTick(() => {
          this.$refs.questionInputs[this.$refs.questionInputs.length-1].focus();
        });
      },

      checkEmpty() {
        console.log(this.questions);
        let flag = false;
        for(const e of this.questions) {
          if(e === '') flag = true;
        }

        if(!flag) return;

        this.questions = this.questions.filter(e => e !== '');
      },

      deleteLine(index) {
        this.questions.splice(index, 1);
      },

      select(p) {
        this.$router.push({ name: 'questions', query: { _id: p._id }});
      },

      addQuestion(q) {
        this.selected.questions.push({
          question: q,
          answer: '',
        });

        this.updateQuestion(this.selected);
      },

      deleteQuestion(i) {
        if(this.pendingDel !== i && this.selected.questions[i].answer) {
          this.pendingDel = i;
          return;
        }

        this.pendingDel = null;
        this.selected.questions.splice(i, 1);

        this.updateQuestion(this.selected);
      },

      async updateQuestion(p) {
        try {
          await post(`/admin/questions/${p._id}`, p.questions);
        } catch(e) {
          console.error(e);
          alert('更新失败!');
        }
      },
    },

    computed: {
      filtered() {
        let result = this.list;
        if(this.filterInfo) result = result.filter(e => e.info);
        if(this.filterAssigned) result = result.filter(e => e.questions.length === 0);
        if(this.filter)
          result = result.filter(e => e.name.indexOf(this.filter) !== -1);
        return result;
      },

      selected() {
        return this.list.find(e => e._id === this.$route.query._id);
      },

      pendingQuestions() {
        let result = this.questions;
        if(this.questionFilter) {
          let segs = this.questionFilter.split(' ');
          for(const s of segs)
            result = result.filter(e => e.indexOf(s) !== -1);
        }

        if(!this.selected) return result;
        else return result.filter(q =>
          this.selected.questions.findIndex(p => p.question === q) === -1);
      },
    },

    watch: {
      questions: {
        handler() {
          if(!this.ready) return;
          if(this.debouncer !== null)
            clearTimeout(this.debouncer);

          this.debouncer = setTimeout(() => {
            this.debouncer = null;
            post('/meta/questions', this.questions, 'PUT')
            .catch(e => {
              console.error(e);
              alert('更新题目列表失败!');
            });
          }, DEBOUNCE);
        },
        deep: true,
      },
    },
  };
});
