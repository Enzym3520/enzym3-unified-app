import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'node_modules',
      'supabase/functions/**', // Deno runtime, different lint target
      'public/**',
      '**/*.config.{js,ts}',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // --- Real-bug rules (errors = block; these catch actual defects) ---
      'react-hooks/rules-of-hooks': 'error', // conditional/looped hooks = crashes
      'react-hooks/exhaustive-deps': 'warn', // stale data / missed updates
      'no-fallthrough': 'error',
      'no-self-assign': 'error',
      'no-unsafe-negation': 'error',
      'no-constant-binary-expression': 'error',
      'no-self-compare': 'error',
      'no-unused-vars': 'off', // handled by the TS-aware version below
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true, caughtErrors: 'none' },
      ],
      // Bare expression statements are flagged, but allow the codebase's ternary/&&
      // call style (e.g. `cond ? renderA() : renderB();`) which has real side effects.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      '@typescript-eslint/no-misused-promises': 'off', // needs type info; off for speed

      // --- Demoted to warnings (style/defensive patterns, not bugs in this codebase) ---
      'no-useless-escape': 'warn',
      'no-useless-assignment': 'warn', // mostly defensive `let x = ''` initializers here
      'no-case-declarations': 'warn',
      'prefer-const': 'warn',

      // --- Off (pure style, would be noise) ---
      'no-extra-boolean-cast': 'off',
      'preserve-caught-error': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // Vite fast-refresh correctness (warn only — shadcn ui files trip this)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
