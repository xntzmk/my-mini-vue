/* eslint-disable @typescript-eslint/no-use-before-define */
import { ReactiveEffect } from '@xntzmk-mini-vue/reactivity'
import { queuePreFlushCbs } from './scheduler'

export function watchEffect(source: any) {
  let cleanup: any
  function onCleanup(fn: any) {
    // 初始化cleanup，不会执行
    cleanup = effect.onStop = () => {
      fn()
    }
  }

  function job() {
    effect.run()
  }

  function getter() {
    if (cleanup)
      cleanup()

    source(onCleanup)
  }

  const effect = new ReactiveEffect(getter, () => {
    queuePreFlushCbs(job)
  })
  effect.run()

  return () => {
    effect.stop()
  }
}
