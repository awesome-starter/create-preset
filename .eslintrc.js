module.exports = {
  root: true,
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['plugin:jsdoc/recommended', 'eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: ['jsdoc', 'prettier'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'prettier/prettier': 'warn',
  },
  settings: {
    jsdoc: {
      mode: 'typescript',
    },
  },
}
