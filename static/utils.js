export function tmpl(name) {
  return fetch(`/modules/${name}.html`);
}

export function comp(name) {
  return fetch(`/components/${name}.html`);
}

export function post(url, data, method = 'POST') {
  return fetch(url, {
    method,
    body: JSON.stringify(data),
    credentials: "same-origin",
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  });
}

export function get(url, method='get') {
  return fetch(url, {
    method,
    credentials: "same-origin",
  });
}

export function deepEq(a, b) {
  if(a === null)
    return b === null;
  if(b === null)
    return a === null;

  if(a === undefined)
    return b === undefined;
  if(b === undefined)
    return a === undefined;

  if(Array.isArray(a)) {
    if(!Array.isArray(b)) return false;
    if(a.length !== b.length) return false;

    return a.every((i, index) => deepEq(i, b[index]));
  }

  if(typeof a === 'object') {
    if(!typeof b === 'object') return false;
    if(Object.keys(a).length != Object.keys(b).length) return false;

    for(const k in a) if(!deepEq(a[k], b[k])) return false;
    return true;
  }

  return a === b;
}

export function deepClone(a) {
  if(a === undefined) return a;
  if(a === null) return a;
  if(Array.isArray(a)) return a.map(e => deepClone(e));
  if(typeof a === 'object') return Object.keys(a).reduce((acc, key) => {
    acc[key] = deepClone(a[key])
    return acc;
  }, {});

  return a;
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    const head = document.getElementsByTagName('head')[0];
    const el = document.createElement('script');
    el.src = src;

    let ready = false;
    const cb = () => {
      if(ready) return;
      ready = true;

      resolve();
    };

    el.onreadystatechange = () => {
      if(el.readyState === 'complete') cb();
    };

    el.onload = cb;

    head.appendChild(el);
  });
}
