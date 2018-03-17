export function tmpl(name) {
  return fetch(`/modules/${name}.html`);
}

export function comp(name) {
  return fetch(`/components/${name}.html`);
}

export function post(url, data) {
  return fetch(url, {
    method: 'POST',
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
