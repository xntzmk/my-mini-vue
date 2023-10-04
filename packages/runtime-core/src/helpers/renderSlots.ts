import { h } from '../h'
import { Fragment } from '../vnode'

export function renderSlots(slots: any, slotsName: string, props: any) {
  const slot = slots[slotsName]

  // 作用域插槽: 子组件传入props, 父组件的slot需要用函数调用
  if (slot) {
    if (typeof slot === 'function')
      return h(Fragment, {}, slot(props))
  }
}
