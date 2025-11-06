module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  globals: {
    chrome: 'readonly',
    CONTEXTA_CONFIG: 'writable',
    SubtitleParser: 'readonly',
    UIInjector: 'readonly',
    QuizManager: 'readonly',
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-redeclare': 'off',
  },
};
