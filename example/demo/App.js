export const App = {
  render() {
    return h(
      'div',
      {
        id: 'info',
        class: ['red', 'green'],
      },
      'hello world')
  },

  setup() {
    return {
      msg: 'aaa',
    }
  },
}
