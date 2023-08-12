import { getCurrentInstance } from './component'

export function provide(key: any, value: any) {
  const currentInstance = getCurrentInstance()

  // 将 value 存储在 currentInstance 的 provides 里
  if (currentInstance) {
    // 解构赋值
    // 如果直接使用 provides = Object.create(parentProvides)
    // 会将 let 声明的 provides 引用一个新的地址,而不会修改原始对象(currentInstance)的 provides
    let { provides } = currentInstance
    const parentProvides = currentInstance.parent.provides

    // 原型只需要初始化一次
    if (provides === parentProvides)
      provides = (currentInstance.provides = Object.create(parentProvides))

    provides[key] = value
  }
}

export function inject(key: string | number, defaultValue: any) {
  const currentInstance = getCurrentInstance()

  if (currentInstance) {
    // 从父组件实例获取 provides 存储
    const parentProvides = currentInstance.parent.provides

    if (key in parentProvides) {
      return parentProvides[key]
    }
    else if (defaultValue) {
      if (typeof defaultValue === 'function')
        return defaultValue()
      else
        return defaultValue
    }
  }
}
