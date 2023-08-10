import { h } from '../../lib/my-mini-vue.esm.js'

window.self = null
export const App = {
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'info',
        class: ['red', 'green'],
      },

      // string
      `hello world${this.msg}`,
      // array
      // [
      //   h('p', { class: 'yellow' }, 'aaa'),
      //   h('span', { class: 'orange' }, 'bbb'),
      // ],
    )
  },

  setup() {
    return {
      msg: '你好aa',
    }
  },
}
