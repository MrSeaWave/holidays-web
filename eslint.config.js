import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import importPlugin, { rules } from 'eslint-plugin-import';
import unusedImports from 'eslint-plugin-unused-imports';
import checkFile from 'eslint-plugin-check-file';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  {
    settings: {
      'import/resolver': {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: true,
        // typescript: {
        //   project: 'packages/*/tsconfig.json',
        // },
        node: true,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylistic,
      tseslint.configs.stylisticTypeChecked,
      importPlugin.flatConfigs.recommended,
      importPlugin.flatConfigs.typescript,
    ],

    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'unused-imports': unusedImports,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/naming-convention': [
        'error',
        {
          // 看见 IFoo 时立刻知道它是一个 接口，看见 Bar 时立刻知道它是一个类型别名
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/prefer-literal-enum-member': 'error',
      '@typescript-eslint/no-unnecessary-type-arguments': 'error',
      '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
      '@typescript-eslint/method-signature-style': 'error',
      '@typescript-eslint/no-restricted-types': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      //  导出函数必须返回类型
      //  "@typescript-eslint/explicit-module-boundary-types": "error",
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/prefer-reduce-type-parameter': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            arguments: false,
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/prefer-promise-reject-errors': 'off',
      // import
      // `namespace` and `default` are handled by TypeScript
      // There's no need to rely on ESLint for this
      // https://github.com/import-js/eslint-plugin-import/issues/2878
      'import/namespace': 'off',
      'import/default': 'off',
      'import/newline-after-import': ['error'],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: 'react*',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '*.+(css|sass|less|scss)',
              group: 'unknown',
              patternOptions: { matchBase: true },
              position: 'after',
            },
            // {
            //   "pattern": "@src/**",
            //   "group": "internal",
            //   "position": "before"
            // }
          ],
          warnOnUnassignedImports: true,
          // The default value is ["builtin", "external", "object"].
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      // React
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    // optional: add this processor to files which not processed by other processors but still require linting
    files: ['src/**/*.webp', 'src/**/*.md', 'src/**/*.css', 'src/**/*.scss', '*.md'],
    processor: 'check-file/eslint-processor-check-file',
  },
  {
    files: ['src/**/*.*'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/no-index': 'error',
      'check-file/filename-blocklist': [
        'error',
        {
          '**/*.model.ts': '*.models.ts',
          '**/*.util.ts': '*.utils.ts',
        },
      ],
      'check-file/filename-naming-convention': [
        'error',
        { '**/!(__)*': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],
      'check-file/folder-naming-convention': ['error', { '**/!(__tests__)': 'KEBAB_CASE' }],
    },
  },
  {
    // 关闭文件检查
    files: ['**/*.md'],
    rules: { 'check-file/filename-naming-convention': 'off' },
  }
);
