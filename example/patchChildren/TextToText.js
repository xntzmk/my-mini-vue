// 新的是 text
// 老的是 text
import { h, ref } from '../../lib/my-mini-vue.esm.js'

const prevChildren = 'oldChild'
const nextChildren = 'newChild'

export default {
  name: 'TextToText',
  setup() {
    const isChange = ref(false)
    window.isChange = isChange

    return {
      isChange,
    }
  },
  render() {
    const self = this

    return self.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren)
  },
}
