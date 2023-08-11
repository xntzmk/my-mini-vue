import { h } from '../../lib/my-mini-vue.esm.js'
import { Foo } from './Foo.js'

window.self = null
export const App = {
  name: 'App',
  render() {
    window.self = this
    return h(
      'div',
      {},
      [
        h('span', { class: 'orange' }, 'bbb'),
        h(
          Foo,
          {
            name: '我是foo的props',
            onAdd(a, b) {
              console.log('App onAdd', a, b)
            },
            onAddFoo(a, b) {
              console.log('App onAddFoo', a, b)
            },

          },
        ),
      ],
    )
  },

  setup() {
    return {
      msg: '你好aa',
    }
  },
}
