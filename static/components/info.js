import { comp, deepEq } from '../utils.js'

export default Vue.component('info', async () => {
  const resp = await comp('info');
  const template = await resp.text();

  return {
    template,
    props: ['value', 'ready'],
    data() {
      return {
        // TODO: respond to upstream changes
        info: Object.assign({}, this.value),
      }
    },
    methods: {
      validate() {
        const list = ['sex', 'ident', 'qq', 'grad', 'group', 'first', 'second'];
        if(list.some(k => this.info[k] === null)) return false;
        if(this.extended && !this.info.know) return false;
        return true;
      },
    },
    watch: {
      info: {
        handler() {
          if(deepEq(this.info, this.value)) return;
          this.$emit('input', this.info);
        },
        deep: true,
      },
      value: {
        handler() {
          this.info = Object.assign({}, this.value);
        },
        deep: true,
      },
    },
    computed: {
      extended() {
        return this.info.first === '危机联动体系' || this.info.second === '危机联动体系';
      },
      filling() {
        return this.extended && this.info.know === '是';
      },
    }
  };
});
