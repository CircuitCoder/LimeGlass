import { tmpl, loadScript, post, get } from '../utils.js'
import CONFIG from '../config.js';

export default Vue.component('Seats', async () => {
  const resp = await tmpl('seats');
  const template = await resp.text();

  return {
    template,
    data: () => ({
      perspective: 'seats',
      data: null,

      searchStr: '',
      showTags: false,
    }),

    created() {
      this.update();
    },

    methods: {
      async update() {
        this.data = await (await get('/admin/seats')).json();
      },
      async startUpdate() {
        // Load GAPI Scripts
        await loadScript('https://apis.google.com/js/api.js');
        await new Promise(resolve => gapi.load('client:auth2:picker', resolve));

        await gapi.auth2.init({
          client_id: CONFIG.GAPI.client
        });

        const SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly';
        const result = await gapi.auth2.getAuthInstance().signIn({ scope: SCOPE });
        if(!result) return;

        const resp = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse();
        const access_token = resp.access_token;

        const picker = new google.picker.PickerBuilder()
          .addView(google.picker.ViewId.SPREADSHEETS)
          .setOAuthToken(access_token)
          .setDeveloperKey(CONFIG.GAPI.key)
          .setCallback(data => this.loadSheet(data))
          .build();
        picker.setVisible(true);
      },

      async loadSheet(data) {
        if(data.action !== 'picked') return;
        const id = data.docs[0].id;

        await gapi.client.load('https://sheets.googleapis.com/$discovery/rest?version=v4');
        const resp = await gapi.client.sheets.spreadsheets.get({
          includeGridData: true,
          spreadsheetId: id,
        });
        const result = resp.result;

        let sheet;
        if(result.sheets.length !== 1) {
          sheet = result.sheets.find(e => e.properties.title === 'Seats');
          if(!sheet) {
            const names = result.sheets.map(e => e.properties.title);
            alert(`存在多个子表: ${names.join(', ')}，其中并无一个表单名为 Seats。请将席位表重命名为 Seats，再试一次`);
            return;
          }
        } else {
          sheet = result.sheets[0];
        }

        const headers = sheet.data[0].rowData[0].values;
        const body = sheet.data[0].rowData.slice(1);

        const parsed = body.map(e =>
          e.values.reduce((acc, _e, i) => {
            const h = headers[i].formattedValue;
            const e = _e.formattedValue;
            if(h === 'ID')
              acc._id = parseInt(e);
            else if(h === 'Title')
              acc.title = e;
            else if(h === 'Name')
              acc.name = e;
            else if(h === 'Tags')
              acc.tags = e.split(' ').filter(e => e.length > 0);
            return acc;
          }, {})
        ).filter(e => !Number.isNaN(e._id));

        await post('/admin/seats', parsed, 'PUT');
        await this.update();
      },

      insertTag(t) {
        if(this.searchStr.split(' ').includes(`#${t}`)) return;
        while(this.searchStr.length > 0 && this.searchStr[0] === ' ')
          this.searchStr = this.searchStr.substr(1);

        this.searchStr = `#${t} ${this.searchStr}`;
      },
    },

    computed: {
      filtered() {
        const segs = this.searchStr.split(' ').filter(e => e.length > 0);
        let result = this.data;

        for(const s of segs) {
          if(s[0] === '#') {
            const f = s.substr(1);
            result = result.filter(e => e.tags.includes(f));
          } else result = result.filter(e => (e.title && e.title.indexOf(s) !== -1)
            || (e.name && e.name.indexOf(s) !== -1));
        }

        return result;
      }
    }
  };
});
