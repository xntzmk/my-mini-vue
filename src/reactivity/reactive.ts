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

function createActiveObject(raw: any, baseHandlers: any) {
  return new Proxy(raw, baseHandlers)
}
