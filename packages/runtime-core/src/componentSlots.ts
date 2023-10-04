import { ShapeFlags } from '@xntzmk-mini-vue/shared'

export function initSlots(instance: any, children: any) {
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN)
    normalizeObjectSlots(children, instance.slots)
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
    // slots[key] 需要赋值一个函数, 在 renderSlots 的时候调用, 传入子组件的props(作用域插槽)
    slots[key] = (props: any) => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value: any) {
  // 这里需要将 children 转为数组类型，因为 h 函数只接受 string 或者 array 的 children
  return Array.isArray(value) ? value : [value]
}
