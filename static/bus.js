class AsyncBus {
  constructor() {
    this.mapper = new Map();
  }
  
  on(ev, name, cb) {
    if(!this.mapper.has(ev)) this.mapper.set(ev, new Map());
    this.mapper.get(ev).set(name, cb);
  }

  off(ev, name) {
    this.mapper.get(ev).delete(name);
  }

  trigger(name) {
    if(!this.mapper.has(name)) return {};

    let promises = [];
    for(const [key, cb] of this.mapper.get(name)) {
      promises.push(new Promise((resolve, reject) => {
        cb().then(result => {
          resolve({ name: key, value: result });
        }).catch(reject);
      }));
    }

    return Promise.all(promises).then(result => result.reduce((add, e) => {
      add[e.name] = e.value;
      return add;
    }, {})); 
  }
};

if(!window.bus) window.bus = new AsyncBus();

export default window.bus;
