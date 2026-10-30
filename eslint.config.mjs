import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  {
    ignores: [
      'node_modules',
      'dist',
      'public',
      'coverage',
      'types',
      'components.d.ts',
      '*.tsbuildinfo',
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    // .vue 文件 script 块交给 TypeScript parser
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    rules: {
      'no-console': process.env.NODE_ENV === 'development' ? 'off' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'development' ? 'off' : 'warn',
      // 部分面向过程或直接在参数对象上修改数据的函数不会有显性的 return
      'consistent-return': 'off',
      'no-undefined': 'warn',
      'no-use-before-define': 'warn',
      camelcase: 'off',
      'no-prototype-builtins': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/no-side-effects-in-computed-properties': 'off',
      // 存量代码中 any 较多（Qt bridge、DOM 指令等），先降为 warn 逐步消除
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
  // prettier 相关规则放在最后，确保覆盖前面的格式化规则
  eslintPluginPrettierRecommended,
);
