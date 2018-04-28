import { tmpl, get, post } from '../utils.js';
import { STATUS_MAP, STATUS_ICON } from '../consts.js';

export default Vue.component('Reviewers', async () => {
  const resp = await tmpl('reviewers');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      list: [],

      ready: false,

      filter: '',
      filterInfo: false,
      filterUrgent: false,

      addReview: false,

      reviewerSet: {},

      STATUS_MAP,
      STATUS_ICON,
    }),

    async created() {
      const resp = await get('/admin/review');
      this.list = await resp.json();
    },

    methods: {
      select(p) {
        this.$router.replace({ name: 'reviewers', query: { _id: p._id }});
      },

      async setReviewerRole(id, isReviewer) {
        const resp = await post(`/admin/review/${id}/isReviewer`, { isReviewer }, 'PUT');
        const payload = await resp.json();

        if(payload.success) {
          this.selected.isReviewer = isReviewer;
          this.addReview = false;
        } else
          alert('更新失败');
      },

      showAddReview() {
        this.reviewerSet = {};
        this.addReview = true;
      },

      toggleReviewer(r) {
        if(this.reviewerSet[r._id])
          this.$set(this.reviewerSet, r._id, null);
        else
          this.$set(this.reviewerSet, r._id, r);
      },

      async addRound() {
        const _s = this.selected;
        const ids = this.selectedReviewers.map(r => r._id);
        const resp = await post(`/admin/review/${this.selected._id}/round`, { reviewers: ids });
        const data = await resp.json();

        if(!data.success)
          alert('提交失败，请稍后再试');
        else
          _s.rounds.push(data.round);

        this.addReview = false;
      },

      names(ids) {
        return this.list.filter(e => ids.includes(e._id)).map(e => e.name).join(', ');
      },

      async updateField(round, iter, field) {
        const data = {};
        data[field] = round[field];

        const resp = await post(`/review/${this.selected._id}/${iter}/${field}`, data, 'PUT')
        const payload = await resp.json();

        if(payload.success) {
          // TODO: no alert here
          alert('提交成功');
        } else
          alert('提交失败，请稍后再试');
      },

      lastStatus(e) {
        console.log(e);
        return e.rounds[e.rounds.length-1].result;
      },

      isUrgent(e) {
        const s = this.lastStatus(e);
        return s === 'Degraded' || s === 'Promoted';
      },

      addQuestion(r) {
        if(r.questions === null) r.questions = [''];
        else r.questions.push('');
      },
    },

    computed: {
      filtered() {
        let result = this.list;
        if(this.filterInfo) result = result.filter(e => e.info);
        if(this.filterUrgent) result = result.filter(e => {
          return !e.isReviewer && (
            e.rounds.length === 0 || this.isUrgent(e)
          );
        });
        if(this.filter)
          result = result.filter(e => e.name.indexOf(this.filter) !== -1);
        return result;
      },

      selected() {
        return this.list.find(e => e._id === this.$route.query._id);
      },

      reviewers() {
        return this.list.filter(e => e.isReviewer);
      },

      selectedReviewers() {
        return Object.keys(this.reviewerSet)
          .filter(k => this.reviewerSet[k])
          .map(k => this.reviewerSet[k]);
      },

      reviewerNames() {
        return this.selectedReviewers.map(r => r.name).join(', ');
      },
    },
  };
});
