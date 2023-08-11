import { h } from '../../lib/my-mini-vue.esm.js'

export const Foo = {
  setup(props, { emit }) {
    function emitAdd() {
      console.log('foo emit add')
      emit('add', 33, 44)
      emit('add-foo', { name: 3 }, 'ddd')
    }
    return {
      emitAdd,
    }
  },
  render() {
    return h(
      'div',
      {},
      [
        h('span', { class: 'blue' }, 'foo'),
        h('button', { onClick: this.emitAdd }, 'emitAdd'),

        // h('button', {
        // onClick() {
        // 这里会被绑定到addEventListener上，this指向dom
        // this.emitAdd()
        // },
        // }, 'emitAdd'),
      ],
    )
  },
}
