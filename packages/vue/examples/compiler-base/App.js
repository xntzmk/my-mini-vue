// 最简单的情况
// template 只有一个 interpolation
// export default {
//   template: `{{msg}}`,
//   setup() {
//     return {
//       msg: "vue3 - compiler",
//     };
//   },
// };

// 复杂一点
// template 包含 element 和 interpolation
import { ref } from '../../dist/xntzmk-mini-vue.esm.js'

export default {
  template: '<div>hi, {{msg}}</div>',
  setup() {
    const msg = ref('vue3 - compiler')

    window.change = () => {
      msg.value += 'a'
    }

    return {
      msg,
    }
  },
}
