import { h, inject, provide } from '../../lib/my-mini-vue.esm.js'

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')

    return {
      foo, bar,
    }
  },

  render() {
    return h('div', {}, `inject: ${this.foo}-${this.bar}`)
  },
}

const ProviderOne = {
  name: 'ProviderOne',
  setup() {
    provide('foo', 'foo one')
    provide('bar', 'bar one')
    return {}
  },
  render() {
    return h('div', {}, [h('div', {}, 'Provider One'), h(Consumer)])
  },
}

export default {
  name: 'App',
  setup() {
  },

  render() {
    return h('div', {}, [h('div', {}, 'App'), h(ProviderOne)])
  },
}
