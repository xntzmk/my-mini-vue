import { reactive } from '../reactive'
import { effect } from './../effect'

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
})
