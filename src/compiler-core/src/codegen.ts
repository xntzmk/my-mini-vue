import { isString } from '../../shared'
import { NodeTypes } from './ast'
import { CREATE_ELEMENT_VNODE, TO_DISPLAY_STRING, helperMapName } from './runtimeHelpers'

export function generate(ast: any) {
  const context = createCodegenContext()
  const { push } = context

  genFunctionPreamble(ast, context)

  const functionName = 'render'
  const args = ['_ctx', '_cache']
  const signature = args.join(', ')

  push(`function ${functionName}(${signature}) { `)
  push('return ')

  genNode(ast.codegenNode, context)

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

function genNode(node: any, context: any) {
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

    case NodeTypes.ELEMENT:
      genElement(node, context)
      break

    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context)
      break

    default:
      break
  }
}

function genCompoundExpression(node: any, context: any) {
  const { push } = context
  const children = node.children
  for (let i = 0; i < children.length; i++) {
    const child = children[i]

    if (isString(child))
      push(child)
    else
      genNode(child, context)
  }
}

function genElement(node: any, context: any) {
  const { push, helper } = context
  const { tag, props, children } = node
  push(`${helper(CREATE_ELEMENT_VNODE)}(`)
  genNodeList(genNullable([tag, props, children]), context)
  push(')')
}

function genNodeList(nodes: any, context: any) {
  const { push } = context
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (isString(node))
      push(node)
    else
      genNode(node, context)

    if (i < node.length - 1)
      push(', ')
  }
}

function genNullable(args: any) {
  return args.map((arg: any) => arg || 'null')
}

function genInterpolation(node: any, context: any) {
  const { push } = context
  push(`${context.helper(TO_DISPLAY_STRING)}(`)
  genNode(node.content, context)
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
