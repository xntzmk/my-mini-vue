import { isObject } from '@xntzmk-mini-vue/shared'
import { ReactiveFlags, mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandler'

export function reactive(raw: any) {
  return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw: any) {
  return createActiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any) {
  return createActiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(raw: any) {
  return !!raw[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(raw: any) {
  return !!raw[ReactiveFlags.IS_READONLY]
}

export function isProxy(raw: any) {
  return isReactive(raw) || isReadonly(raw)
}

function createActiveObject(raw: any, baseHandlers: any) {
  if (!isObject(raw)) {
    console.warn(`target ${raw} 不是对象类型`)
    return raw
  }

  return new Proxy(raw, baseHandlers)
}
