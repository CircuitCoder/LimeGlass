export default {
  secret: '',
  name: '',
  port: 6067,
  db: '',
  mail: {
    addr: '',
    smtp: {
      host: '',
      port: 0,
      secure: false,
      auth: {
        user: '',
        pass: '',
      },
    },
    sig: '',
  },
  url: '',
  tgBase: '',
  tgBot: '',
  tgUpdate: [],

  items: [
    {
      title: 'Title',
      choices: [
        { name: 'Somename', price: 100 }, // In CNY
      ],
      slots: [ // Optional
        'Day1', 'Day2'
      ],
      notes: [ // Optional
        'Note1',
      ],
    },
  ],
};
