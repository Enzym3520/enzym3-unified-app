import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import unusedImports from 'eslint-plugin-unused-imports';
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
      'unused-imports': unusedImports,
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
      'no-unused-vars': 'off',
      // unused-imports autofixes dead imports (safe — imports have no side effects);
      // the TS rule still flags unused locals/args (NOT autofixed — those can hide
      // side-effectful calls, so they're cleaned by hand).
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          caughtErrors: 'none', // unused `catch (error)` bindings are a fine pattern
        },
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
  {
    // ui primitives and context providers legitimately co-export variants/hooks
    // alongside components — react-refresh's one-export rule is a false positive here.
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/contexts/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
);
