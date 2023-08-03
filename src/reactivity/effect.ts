/* eslint-disable @typescript-eslint/no-this-alias */

let activeEffect: any
class ReactiveEffect {
  private _fn: any

  constructor(fn: any) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    this._fn()
  }
}

export function effect(fn: any) {
  const _effect = new ReactiveEffect(fn)
  _effect.run()
}

const targetMaps = new Map()
export function track(target: any, key: any) {
  let depMaps = targetMaps.get(target)
  if (!depMaps) {
    depMaps = new Map()
    targetMaps.set(target, depMaps)
  }

  let dep = depMaps.get(key)
  if (!dep) {
    dep = new Set()
    depMaps.set(key, dep)
  }

  dep.add(activeEffect)
}

export function trigger(target: any, key: any) {
  const depMaps = targetMaps.get(target)
  const dep = depMaps.get(key)

  for (const effect of dep)
    effect.run()
}
