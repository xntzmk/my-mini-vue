import { getCurrentInstance } from './component'

export function provide(key: any, value: any) {
  const currentInstance = getCurrentInstance()

  // 将 value 存储在 currentInstance 的 provides 里
  if (currentInstance) {
    const { provides } = currentInstance
    provides[key] = value
  }
}

export function inject(key: string | number) {
  const currentInstance = getCurrentInstance()

  if (currentInstance) {
    // 从父组件实例获取 provides 存储
    const parentProvides = currentInstance.parent.provides
    const value = parentProvides[key]
    return value
  }
}
