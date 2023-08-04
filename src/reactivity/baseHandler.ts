import { track, trigger } from './effect'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

export function createGetter(isReadonly = false) {
  return function (target: any, key: any) {
    const res = Reflect.get(target, key)

    // 依赖收集
    if (!isReadonly)
      track(target, key)

    return res
  }
}

function createSetter() {
  return function (target: any, key: any, value: any) {
    const res = Reflect.set(target, key, value)

    // 触发依赖
    trigger(target, key)

    return res
  }
}

export const mutableHandlers = {
  get,
  set,
}

export const readonlyHandlers = {
  get: readonlyGet,
  set(target: any, key: any, value: any) {
    console.warn(`key:${key} set 失败，因为 target 是 readonly 类型`)
    return true
  },
}
