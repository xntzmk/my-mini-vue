import typescript from '@rollup/plugin-typescript'

export default {
  input: './packages/vue/src/index.ts',
  output: [
    // 1. Commonjs
    {
      format: 'cjs',
      file: 'packages/vue/dist/xntzmk-mini-vue.cjs.js',
    },
    // 2. ESmodule
    {
      format: 'es',
      file: 'packages/vue/dist/xntzmk-mini-vue.esm.js',
    },
  ],

  plugins: [typescript()],
}
