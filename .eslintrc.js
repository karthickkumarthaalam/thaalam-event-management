module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  rules: {
    'prettier/prettier': ['error', { bracketSpacing: true }],
    'object-curly-spacing': ['error', 'always'],
    'no-trailing-spaces': 'error',
    'no-unexpected-multiline': 'error',
  },
};
