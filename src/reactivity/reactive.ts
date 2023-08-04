import { track, trigger } from './effect'

function createGetter(isReadonly = false) {
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

export function reactive(raw: any) {
  return new Proxy(raw, {
    get: createGetter(),
    set: createSetter(),
  })
}

export function readonly(raw: any) {
  return new Proxy(raw, {
    get: createGetter(),
    set(target, key, value) {
      return true
    },
  })
}
