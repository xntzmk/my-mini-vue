import { h, renderSlots } from '../../lib/my-mini-vue.esm.js'

export const Foo = {
  setup() {
    return {}
  },
  render() {
    const foo = h('p', { class: 'orange' }, 'foo')
    return h('div', {}, [foo, renderSlots(this.$slots)])
  },
}
