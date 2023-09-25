import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING, helperMapName } from './runtimeHelpers'

export function generate(ast: any) {
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}) { `)
  push('return ')

  genCode(ast.codegenNode, context)

  push(' }')

  return context
}

function genFunctionPreamble(ast: any, context: any) {
  const { push } = context
  const VueBinging = 'Vue'
  const aliasHelper = (s: any) => `${helperMapName[s]}: _${helperMapName[s]}`

  if (ast.helpers.length > 0)
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`)

  push('\n')
  push('return ')
}

function genCode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context)
      break

    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context)
      break

    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break

    default:
      break
  }
}

function genInterpolation(node: any, context: any) {
  const { push } = context
  push(`${context.helper(TO_DISPLAY_STRING)}(`)
  genCode(node.content, context)
  push(')')
}

function genExpression(node: any, context: any) {
  const { push } = context
  push(`${node.content}`) // _ctx 在 transform 里添加
}

function genText(node: any, context: any) {
  const { push } = context
  push(`'${node.content}'`)
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: any) {
      context.code += source
    },
    helper(key: any) {
      return `_${helperMapName[key]}`
    },
  }

  return context
}
