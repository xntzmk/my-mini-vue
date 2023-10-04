// 测试 nextTick 逻辑
import { h, ref } from '../../dist/xntzmk-mini-vue.esm.js'

window.count = ref(1)

// 如果一个响应式变量同时触发了两个组件的 update
// 会发生什么有趣的事呢？
const Child1 = {
  name: 'NextTickerChild1',
  setup() {},
  render() {
    return h('div', {}, `child1 count:${window.count.value}`)
  },
}

const Child2 = {
  name: 'NextTickerChild2',
  setup() {},
  render() {
    return h('div', {}, `child2 count:${window.count.value}`)
  },
}

export default {
  name: 'NextTicker',
  setup() {

  },
  render() {
    return h(
      'div',
      { tId: 'nextTicker' },
      [h(Child1), h(Child2)],
      //   `for nextTick: count: ${window.count.value}`
    )
  },
}
