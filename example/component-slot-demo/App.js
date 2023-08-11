import { h } from '../../lib/my-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    const app = h('div', { class: 'blue' }, 'app')
    const header = h('header', { class: 'red' }, '我是header')
    const footer = h('footer', { class: 'green' }, '我是footer')

    // 传入 slots: array / vnode
    // const foo = h(Foo, {}, header)
    const foo = h(Foo, {}, [header, footer])
    return h('div', {}, [app, foo])
  },

  setup() {
    return {}
  },
}
