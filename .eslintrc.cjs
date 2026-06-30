module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es6: true,
  },
  plugins: ['prettier', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-essential',
    'plugin:vue/vue3-recommended',
    'prettier',
    'sonarjs',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  globals: {
    module: true,
    require: true,
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'development' ? 'off' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'development' ? 'off' : 'warn',
    // 'line-comment-position': 'off',
    // 部分面向过程或直接在参数对象上修改数据的函数不会有显性的return
    'consistent-return': 'off',
    'no-undefined': 'warn', // 没有undefined
    'no-use-before-define': 'warn', // 在定义之前使用
    camelcase: 'off', // 下划线报错
    'vue/no-v-model-argument': 'off', // vue v-model禁用参数
    // 与prettier冲突
    'no-extra-parens': 'off',
    // 与prettier冲突，缩进由prettier控制即可
    indent: 'off',
    // diy
    'line-comment-position': 'off',
    'vue/no-side-effects-in-computed-properties': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/multi-word-component-names': 'off',
    'filenames/match-exported': 'off',
    'no-prototype-builtins': 'off',
    complexity: 'off',
    'no-magic-numbers': 'off',
    '@typescript-eslint/no-magic-numbers': [
      'error',
      {
        ignore: [-1, 0, 1],
        ignoreArrayIndexes: true,
        ignoreNumericLiteralTypes: true,
        ignoreTypeIndexes: true,
        ignoreReadonlyClassProperties: true,
        ignoreEnums: true,
      },
    ],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
