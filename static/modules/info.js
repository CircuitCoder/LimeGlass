import { tmpl, post } from '../utils.js'

const THR = 1000;

export default Vue.component('Info', async () => {
  const resp = await tmpl('info');
  const template = await resp.text();

  return {
    template,
    props: ['user'],
    data: () => ({
      sex: null,
      ident: null,
      wechat: null,
      qq: null,
      contact: null,
      grad: null,
      group: null,

      first: null,
      second: null,

      know: null,

      a11: null,
      a21: null,
      a22: null,

      b1: null,
      b2: null,

      spec: null,

      e1: null,
      e2: null,
      e3: null,
      e4: null,
      e5: null,

      g1: null,
      g2: null,

      curThr: null,
      ready: false,
    }),
    created() {
      if(!this.user.info) return;

      // Displaying mode
      this.ready = true;
      const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
          'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
      for(const key of list) {
        this[key] = this.user.info[key];
        if(!this[key]) this[key] = '[[ 未填写 ]]';
      }
    },
    methods: {
      throttle() {
        if(this.curThr !== null) return;
        this.curThr = setTimeout(() => {
          this.curThr = null;
          // TODO: stash
        }, THR);
      },

      validate() {
        const list = ['sex', 'ident', 'qq', 'grad', 'group', 'first', 'second'];
        if(list.some(k => this[k] === null)) return false;
        if(this.extended && !this.know) return false;
        return true;
      },

      async submit() {
        if(!this.validate()) {
          alert('请检查是否有必填项未填');
          return;
        }
        const list = ['sex', 'ident', 'wechat', 'qq', 'contact', 'grad', 'group', 'first', 'second', 'know',
            'a11', 'a21', 'a22', 'b1', 'b2', 'spec', 'e1', 'e2', 'e3', 'e4', 'e5', 'g1', 'g2',];
        const payload = {};
        for(const key of list) payload[key] = this[key];
        const resp = await post('/account/info', payload);
        const jresp = await resp.json();
        if(jresp.success) {
          alert('提交成功!');
          this.$emit('refresh');
          this.$router.push({ name: 'home' });
        }
      }
    },

    computed: {
      extended() {
        return this.first === '危机联动体系' || this.second === '危机联动体系';
      },
      filling() {
        return this.extended && this.know === '是';
      },
    }
  };
});
