import typescript from '@rollup/plugin-typescript'
import pkg from './package.json' assert {type: 'json'}

export default {
  input: './src/index.ts',
  output: [
    // 1. Commonjs
    {
      format: 'cjs',
      file: pkg.main,
    },
    // 2. ESmodule
    {
      format: 'es',
      file: pkg.module,
    },
  ],

  plugins: [
    typescript(),
  ],
}
