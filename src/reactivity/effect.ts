/* eslint-disable @typescript-eslint/no-this-alias */

import { extend } from '../shared'

let activeEffect: any
class ReactiveEffect {
  [x: string]: any
  private _fn: any
  deps = []
  active = true

  constructor(fn: any, public scheduler?: any) {
    this._fn = fn
  }

  run() {
    activeEffect = this
    return this._fn()
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

  if (!activeEffect)
    return

  dep.add(activeEffect)
  activeEffect.deps.push(dep)
}

export function trigger(target: any, key: any) {
  const depMaps = targetMaps.get(target)
  const dep = depMaps.get(key)

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
