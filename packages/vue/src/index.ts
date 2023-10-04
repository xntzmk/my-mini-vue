/* eslint-disable no-new-func */

// mini-vue 导出
import { baseCompile } from '@xntzmk-mini-vue/compiler-core'

import { registerRuntimeCompiler } from '@xntzmk-mini-vue/runtime-dom'
import * as runtimeDom from '@xntzmk-mini-vue/runtime-dom'

export * from '@xntzmk-mini-vue/runtime-dom'

// new Function(...args, functionBody) 前面都是参数列表，最后的参数是函数体
function compilerToFunction(template: any) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  return render
}

registerRuntimeCompiler(compilerToFunction)
