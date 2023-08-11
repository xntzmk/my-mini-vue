export function initSlots(instance: any, children: any) {
  // 这里需要将 children 转为数组类型，因为 h 函数只接受 string 或者 array 的 children
  instance.slots = Array.isArray(children) ? children : [children]
}
