import { h, renderSlots } from '../../dist/xntzmk-mini-vue.esm.js'

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
        renderSlots(this.$slots, 'header', { age: 18, name: 'aaa' }),
        foo,
        renderSlots(this.$slots, 'footer'),
      ])
  },
}
