import { h, renderSlots } from '../../lib/my-mini-vue.esm.js'

export const Foo = {
  setup() {
    return {}
  },
  render() {
    console.log(this.$slots)
    const foo = h('p', { class: 'orange' }, 'foo')
    return h(
      'div',
      {},
      // 具名插槽
      [
        renderSlots(this.$slots, 'header'),
        foo,
        renderSlots(this.$slots, 'footer'),
      ])
  },
}
