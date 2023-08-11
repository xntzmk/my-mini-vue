export function initSlots(instance: any, children: any) {
  normalizeObjectSlots(children, instance.slots)
}

function normalizeObjectSlots(children: any, slots: any) {
  for (const key in children) {
    const value = children[key]
    slots[key] = normalizeSlotValue(value)
  }
}

function normalizeSlotValue(value: any) {
  // 这里需要将 children 转为数组类型，因为 h 函数只接受 string 或者 array 的 children
  return Array.isArray(value) ? value : [value]
}
