import { getCurrentInstance, h } from '../../lib/my-mini-vue.esm.js'

export const Foo = {
  setup() {
    const instance = getCurrentInstance()
    console.log('foo: ', instance)

    return {}
  },
  render() {
    return h('div', {}, 'foo')
  },
}
