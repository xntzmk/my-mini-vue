/* eslint-disable @typescript-eslint/no-this-alias */

import { extend } from '../shared'

let activeEffect: any
let shouldTrack = false // 控制 stop 操作后 trigger 里 run 的运行
export class ReactiveEffect {
  [x: string]: any
  private _fn: any
  deps = []
  active = true

  constructor(fn: any, public scheduler?: any) {
    this._fn = fn
  }

  run() {
    if (!this.active)
      return this._fn()

    shouldTrack = true
    activeEffect = this

    const res = this._fn() // 这里运行后会触发 get 操作
    shouldTrack = false

    return res
  }

  stop() {
    if (this.active) {
      this.active = false
      this.onStop && this.onStop()
      cleanUpEffect(this)
    }
  }
}

function cleanUpEffect(effect: any) {
  effect.deps.forEach((dep: any) => {
    dep.delete(effect)
  })
}

export function effect(fn: any, options: any = {}) {
  const _effect = new ReactiveEffect(fn)
  extend(_effect, options)

  _effect.run()

  const runner: any = _effect.run.bind(_effect)
  runner.effect = _effect

  return runner
}

const targetMaps = new Map()
export function track(target: any, key: any) {
  // 提取不需要 track 的情况
  if (!isTracking())
    return

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

  trackEffects(dep)
}

export function trackEffects(dep: any) {
  if (dep.has(activeEffect))
    return
  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function isTracking() {
  return shouldTrack && activeEffect !== undefined
}

export function trigger(target: any, key: any) {
  const depMaps = targetMaps.get(target)
  const dep = depMaps.get(key)

  triggerEffects(dep)
}

export function triggerEffects(dep: any) {
  for (const effect of dep) {
    if (effect.scheduler)
      effect.scheduler()
    else
      effect.run()
  }
}

export function stop(runner: any) {
  runner.effect.stop()
}
