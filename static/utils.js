export function tmpl(name) {
  return fetch(`/modules/${name}.html`);
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

export function get(url) {
  return fetch(url, {
    credentials: "same-origin",
  });
}
