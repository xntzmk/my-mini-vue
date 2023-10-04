/* eslint-disable no-cond-assign */
const queue: any[] = []

const activePreFlushCbs: any[] = []

let isFlushPending = false // 锁定微任务队列
const p = Promise.resolve()

export function nextTick(fn?: any) {
  return fn ? p.then(fn) : p
}

export function queueJobs(job: any) {
  if (!queue.includes(job))
    queue.push(job)

  queueFlush()
}

export function queuePreFlushCbs(job: any) {
  job && activePreFlushCbs.push(job)

  queueFlush()
}

function queueFlush() {
  if (isFlushPending)
    return
  isFlushPending = true

  nextTick(flushJobs)
}

function flushJobs() {
  isFlushPending = false

  // watchEffect 在组件渲染前执行
  flushPreFlushCbs()

  // 组件渲染
  let job
  while (job = queue.shift())
    job && job()
}

function flushPreFlushCbs() {
  for (let i = 0; i < activePreFlushCbs.length; i++)
    activePreFlushCbs[i]()
}
