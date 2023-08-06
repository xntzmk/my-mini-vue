import { ReactiveEffect } from './effect'

class ComputedRefImpl {
  private _effect: ReactiveEffect
  private _dirty: boolean = true
  private _value: any

  constructor(getter: any) {
    this._effect = new ReactiveEffect(getter, () => {
      // 响应式对象值改变时，重置 _dirty，让下一次 get 操作时重新运行 run 方法
      if (!this._dirty)
        this._dirty = true
    })
  }

  get value() {
    // 生成缓存
    if (this._dirty) {
      this._dirty = false
      this._value = this._effect.run()
    }
    return this._value
  }
}

export function computed(getter: any) {
  return new ComputedRefImpl(getter)
}
