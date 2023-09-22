import { getCurrentInstance, h, nextTick, ref } from '../../lib/my-mini-vue.esm.js'

// import NextTicker from './NextTicker.js'

// 如果 for 循环改变 count 的值 100 次的话
// 会同时触发 100 次的 update 页面逻辑
// 这里可以把 update 页面的逻辑放到微任务中执行
// 避免更改了响应式对象就会执行 update 的逻辑
// 因为只有最后一次调用 update 才是有价值的

export default {
  name: 'App',
  setup() {
    const count = ref(0)
    const instance = getCurrentInstance()

    async function onClick() {
      for (let i = 0; i < 100; i++) {
        console.log('update')
        count.value++
      }

      console.log(instance.vnode.el.innerText) // 0

      await nextTick() // 本质是微任务队列的应用
      console.log(instance.vnode.el.innerText) // 100
    }

    return {
      count,
      onClick,
    }
  },

  render() {
    const button = h('button', { onClick: this.onClick }, 'update')
    const p = h('p', { }, `count: ${this.count}`)
    return h('div', {}, [button, p])
    // return h('div', { tId: 1 }, [h('p', {}, '主页'), h(NextTicker)])
  },
}
