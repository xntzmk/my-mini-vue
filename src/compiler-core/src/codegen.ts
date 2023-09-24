export function generate(ast: any) {
  const context = createCodegenContext()
  const { push } = context

  const functionName = 'render'
  const args = ['_ctx', '_catche']
  const signature = args.join(', ')

  push('return ')
  push(`function ${functionName}(${signature}) { `)
  push('return ')

  generateCode(ast.codegenNode, context)

  push(' }')

  return context
}

function generateCode(node: any, context: any) {
  const { push } = context
  push(`'${node.content}'`)
}

function createCodegenContext() {
  const context = {
    code: '',
    push(source: any) {
      context.code += source
    },
  }

  return context
}
