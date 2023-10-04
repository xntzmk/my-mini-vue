import { h, inject, provide } from '../../dist/xntzmk-mini-vue.esm.js'

const Consumer = {
  name: 'Consumer',
  setup() {
    const foo = inject('foo')
    const bar = inject('bar')
    const zoo = inject('zoo', 'zoo default')
    const coo = inject('zoo', () => 'coo')

    return {
      foo, bar, zoo, coo,
    }
  },

  render() {
    return h('div', {}, `inject: ${this.foo}-${this.bar}-${this.zoo}-${this.coo}`)
  },
}

const ProviderTwo = {
  name: 'ProviderTwo',
  setup() {
    provide('foo', 'foo two')
    const foo = inject('foo')
    return {
      foo,
    }
  },
  render() {
    return h('div', {}, [h('div', {}, `Provider Two: ${this.foo}`), h(Consumer)])
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
    return h('div', {}, [h('div', {}, 'Provider One'), h(ProviderTwo)])
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
