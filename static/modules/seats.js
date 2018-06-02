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
      users: {},
      userList: [],

      importing: false,
      assigning: null,

      searchStr: '',
      userStr: '',
      showTags: false,
    }),

    created() {
      this.fetchUsers();
      this.update();
    },

    methods: {
      async fetchUsers() {
        this.userList = await (await get('/admin/list')).json();
        this.users = {};

        for(const u of this.userList)
          if(!u.isAdmin && !u.isReviewer)
            this.users[u._id] = u;
      },
      async update() {
        this.data = await (await get('/admin/seats')).json();
      },
      async startUpdate() {
        this.importing = true;
        // Load GAPI Scripts
        await loadScript('https://apis.google.com/js/api.js');
        await new Promise(resolve => gapi.load('client:auth2:picker', resolve));

        await gapi.auth2.init({
          client_id: CONFIG.GAPI.client
        });

        const SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly';
        const result = await gapi.auth2.getAuthInstance().signIn({ scope: SCOPE });
        if(!result) {
          this.importing = false;
          return;
        }

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
            this.importing = false;
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
        this.importing = false;
      },

      insertTag(t) {
        const splited = this.searchStr.split(' ').filter(e => e.length > 0);
        if(splited.includes(`@${t}`)) return;

        let pos = splited.findIndex(e => e[0] !== '@');
        if(pos === -1) pos = splited.length;
        splited.splice(pos, 0, `@${t}`);
        this.searchStr = splited.join(' ');
      },

      toggleTag(t) {
        if(!this.selectedTags.includes(t))
          return this.insertTag(t);

        const splited = this.searchStr.split(' ').filter(e => e.length > 0);
        let pos = splited.findIndex(e => e === `@${t}`);
        splited.splice(pos, 1);
        this.searchStr = splited.join(' ');
      },

      async assign(s) {
        const target = this.assigning;
        if(this.assignedStatus[s._id])
          await get(`/admin/seat/${this.assignedStatus[s._id]._id}`, 'DELETE');

        await post(`/admin/seat/${s._id}`, {
          user: this.assigning._id
        }, 'PUT');

        await this.update();
        this.assigning = false;
      },

      gotoSeat(s) {
        this.searchStr = [s.name, s.title].filter(e => !!e).join(' ');
        this.perspective = 'seats';
      },

      gotoUser(u) {
        this.userStr = u.name;
        this.perspective = 'assignments';
      },

      async releaseSeat(s) {
        await get(`/admin/seat/${s._id}`, 'DELETE');
        await this.update();
      },
    },

    computed: {
      filtered() {
        const segs = this.searchStr.split(' ').filter(e => e.length > 0);
        let result = this.data;

        for(const s of segs) {
          if(s[0] === '@') {
            const f = s.substr(1);
            result = result.filter(e => e.tags.includes(f));
          } else result = result.filter(e => (e.title && e.title.indexOf(s) !== -1)
            || (e.name && e.name.indexOf(s) !== -1));
        }

        return result;
      },

      tags() {
        const mapper = new Map();

        for(const d of this.filtered) {
          for(const t of d.tags) {
            if(!mapper.has(t)) mapper.set(t, {
              name: t,
              occupied: 0,
              total: 0,
            });

            const store = mapper.get(t);
            ++store.total;
            if(d.assigned) ++store.occupied;
          }
        }

        const result = Array.from(mapper.values());
        result.sort((a, b) => {
          if(a.total !== b.total)
            return b.total - a.total
          else return a.name.localeCompare(b.name);
        });
        return result;
      },

      selectedTags() {
        return this.searchStr.split(' ').filter(e => e[0] === '@').map(e => e.substr(1));
      },

      filteredUsers() {
        const segs = this.userStr.split(' ').filter(e => e.length > 0);
        let result = this.userList;
        for(const s of segs)
          result = result.filter(e => e.name.indexOf(s) !== -1);
        return result;
      },

      assignedStatus() {
        const result = {};
        for(const s of this.data)
          if(s.assigned)
            result[s.assigned] = s;

        return result;
      },

      filteredVacant() {
        return this.filteredUsers.filter(e => !this.assignedStatus[e._id]);
      },

      filteredAssigned() {
        return this.filteredUsers.filter(e => this.assignedStatus[e._id]);
      },
    }
  };
});
