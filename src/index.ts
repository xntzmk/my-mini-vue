/* eslint-disable no-new-func */
import { baseCompile } from './compiler-core/src'

// mini-vue 导出
import { registerRuntimeCompiler } from './runtime-dom'
import * as runtimeDom from './runtime-dom'

export * from './runtime-dom'

// new Function(...args, functionBody) 前面都是参数列表，最后的参数是函数体
function compilerToFunction(template: any) {
  const { code } = baseCompile(template)
  const render = new Function('Vue', code)(runtimeDom)
  return render
}

registerRuntimeCompiler(compilerToFunction)
