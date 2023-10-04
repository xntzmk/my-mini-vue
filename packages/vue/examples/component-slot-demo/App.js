import { createTextVNode, h } from '../../dist/xntzmk-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: 'App',
  render() {
    const app = h('div', { class: 'blue' }, 'app')
    const header = props => [h('header', { class: 'red' }, `我是header: ${props.name}`), createTextVNode('我是文本节点')]
    const footer = props => h('footer', { class: 'green' }, `我是footer: ${props}`)

    // 传入 slots: array / vnode
    // const foo = h(Foo, {}, header)
    // const foo = h(Foo, {}, [header, footer])
    const foo = h(Foo, {}, { header, footer })
    return h('div', {}, [app, foo])
  },

  setup() {
    return {}
  },
}
