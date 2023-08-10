import { h } from '../../lib/my-mini-vue.esm.js'

export const App = {
  render() {
    return h(
      'div',
      {
        id: 'info',
        class: ['red', 'green'],
      },

      // string
      // 'hello world',
      // array
      [
        h('p', { class: 'yellow' }, 'aaa'),
        h('span', { class: 'orange' }, 'bbb'),
      ],
    )
  },

  setup() {
    return {
      msg: 'aaa',
    }
  },
}
