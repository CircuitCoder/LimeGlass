import { tmpl, get } from '../utils.js'
import FileSaver from 'https://cdn.bootcss.com/FileSaver.js/2014-11-29/FileSaver.min.js';
import moment from 'https://cdn.bootcss.com/moment.js/2.22.0/moment.min.js';

const MAPPER = [
  { sex: '性别' },
  { ident: '身份证号' },
  { wechat: '微信号' },
  { qq: 'QQ号' },
  { contact: '其他联系方式' },
  { grad: '毕业年份' },
  { group: '团体报名' },
  { first: '第一志愿' },
  { second: '第二志愿' },
  { know: '了解自己所擅长的方向或地区局势' },
  { a11: '地区: 最擅长' },
  { a21: '次擅长' },
  { a22: '次擅长' },
  { b1: '方向: 最擅长' },
  { b2: '次擅长' },
  { spec: '专长' },
  { e1: '参会经历' },
  { e2: '' },
  { e3: '' },
  { e4: '' },
  { e5: '' },
  { g1: '组织经历' },
  { g2: '' },
];

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

      genCSV() {
        // Generate header
        const headers = ['ID', '姓名', '邮箱', '学校', '手机'];
        const data = [];
        for(const c of MAPPER)
          for(const p in c) headers.push(c[p]);

        for(const e of this.list) {
          const row = [
            e._id,
            e.name,
            e.email,
            e.school,
            e.phone,
          ];

          console.log(e.info);
          for(const c of MAPPER)
            for(const p in c) row.push(e.info ? e.info[p] : '');

          data.push(row);
        }

        data.sort((a,b) => {
          a - b;
        });

        const content = headers.join(',') + '\n' + data.map(d => d.join(',')).join('\n');

        const fn = `LimeGlass-${moment().format('MM-DD')}.csv`;
        const file = new File([content], fn, { type: 'text/csv;charset=utf-8' });
        FileSaver(file, fn);
      },
    },
  };
});
