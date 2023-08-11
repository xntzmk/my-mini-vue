import { h } from '../../lib/my-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
  render() {
    window.self = this
    return h(
      'div',
      {
        id: 'info',
        class: ['red', 'green'],
        onClick() {
          console.log('134')
        },
        onMouseover() {
          console.log('over')
        },
      },

      // string
      // `hello world${this.msg}`,
      // array
      [
        // h('p', { class: 'yellow' }, 'aaa'),
        h('span', { class: 'orange' }, 'bbb'),
        h(Foo, { name: '我是foo的props' }),
      ],
    )
  },

  setup() {
    return {
      msg: '你好aa',
    }
  },
}
