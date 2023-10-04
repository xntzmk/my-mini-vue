import { reactive } from '../src/reactive'
import { effect, stop } from '../src/effect'

describe('effect', () => {
  it('happy path', () => {
    const user = reactive({ age: 10 })
    let nextAge

    effect(() => {
      nextAge = user.age + 1
    })
    expect(nextAge).toBe(11)

    // update: test track & trigger
    user.age++
    expect(nextAge).toBe(12)
  })

  it('return runner when call effect', () => {
    // effect 返回 runner函数，调用runner函数会再次调用fn，并且返回fn的返回值
    let foo = 10

    const runner: any = effect(() => {
      foo++
      return 'foo'
    })

    expect(foo).toBe(11)
    const res = runner()
    expect(foo).toBe(12)
    expect(res).toBe('foo')
  })

  it('scheduler', () => {
    let dummy
    let run: any
    const obj = reactive({ foo: 1 })

    const scheduler = vi.fn(() => {
      run = runner
    })

    const runner = effect(
      () => {
        dummy = obj.foo
      },
      { scheduler },
    )

    expect(scheduler).not.toHaveBeenCalled()
    expect(dummy).toBe(1)
    // should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)

    // should not run yet
    expect(dummy).toBe(1)

    // manually run
    run()
    // should have run
    expect(dummy).toBe(2)
  })

  it('stop', () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
      dummy = obj.prop
    })

    obj.prop = 2
    expect(dummy).toBe(2)

    stop(runner)
    // obj.prop = 3 // 只触发 get 操作
    obj.prop++ // 触发 get 和 set 操作（effect.run 再次触发依赖）
    expect(dummy).toBe(2)

    // stopped effect should still be manually callable
    runner()
    expect(dummy).toBe(3)
  })

  it('events: onStop', () => {
    const onStop = vi.fn()
    const runner = effect(() => {}, {
      onStop,
    })

    stop(runner)
    expect(onStop).toHaveBeenCalled()
  })
})
