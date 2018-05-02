import { tmpl, post } from '../utils.js'

export default Vue.component('Send', async () => {
  const resp = await tmpl('send');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      isReviewer: null, 
      filled: true,
      unpaid: false,

      content: '',
      title: '',
    }),

    methods: {
      async send() {
        if(!this.title) {
          alert('标题不能为空');
          return;
        }
        const resp = await post('/admin/notif', {
          isReviewer: this.isReviewer,
          filled: this.filled,
          unpaid: this.unpaid,

          content: this.content,
          title: this.title,
        });

        const payload = await resp.json();
        alert(`已发往 ${payload.count} 人`);
        this.content =  '';
        this.title = '';
      },
    },
  };
});
