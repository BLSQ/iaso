/* eslint-disable import/extensions */
import { defineConfig, globalIgnores } from 'eslint/config';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import prettierPlugin from 'eslint-plugin-prettier';
import importPlugin from 'eslint-plugin-import';
import formatjs from 'eslint-plugin-formatjs';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(['**/node_modules/', '**/build/', '**/dist/', '**/*.min.js']),
    {
        extends: fixupConfigRules(
            compat.extends(
                'plugin:react-hooks/recommended',
                'plugin:cypress/recommended',
                'plugin:react/recommended',
                'plugin:react/jsx-runtime',
                'prettier',
            ),
        ),

        plugins: {
            formatjs,
            prettier: prettierPlugin,
            '@typescript-eslint': fixupPluginRules(typescriptEslint),
            import: importPlugin,
            'jsx-a11y': jsxA11y,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.commonjs,
                // Cypress globals
                Cypress: 'readonly',
                cy: 'readonly',
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                beforeEach: 'readonly',
                after: 'readonly',
                afterEach: 'readonly',
                context: 'readonly',
                expect: 'readonly',
                ...globals.node,
                after: 'readonly',
                afterEach: 'readonly',
                before: 'readonly',
                beforeEach: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                it: 'readonly',
                mount: 'readonly',
                render: 'readonly',
                shallow: 'readonly',
                sinon: 'readonly',
                URLSearchParams: 'readonly',
            },

            ecmaVersion: 2020,
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        settings: {
            react: { version: '^17.0.0' },
            'import/resolver': {
                node: {
                    extensions: ['.js', '.jsx', '.ts', '.tsx'],
                },

                webpack: {
                    config: 'frontend/webpack_dev.js',
                },
            },
        },

        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'off',
                    jsx: 'off',
                    ts: 'off',
                    tsx: 'off',
                    mjs: 'off',
                },
            ],

            camelcase: 'off',
            'class-methods-use-this': 'warn',
            'constructor-super': 'warn',
            'import/no-extraneous-dependencies': 'off',
            'import/prefer-default-export': 'off',
            'jsx-a11y/anchor-is-valid': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/control-has-associated-label': 'off',
            'jsx-a11y/href-no-hash': 'off',
            'jsx-a11y/jsx-wrap-multilines': 'off',
            'jsx-a11y/label-has-associated-control': 'off',
            'jsx-a11y/label-has-for': 'warn',
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
            'linebreak-style': 'off',

            'max-len': [
                'warn',
                {
                    code: 200,
                },
            ],

            'no-bitwise': 'warn',
            'no-case-declarations': 'warn',

            'no-console': [
                'error',
                {
                    allow: ['warn', 'error'],
                },
            ],

            'no-const-assign': 'warn',
            'no-continue': 'warn',
            'no-nested-ternary': 'warn',
            'no-prototype-builtins': 'warn',
            'no-restricted-syntax': 'warn',
            'no-tabs': 'off',
            'no-this-before-super': 'warn',
            'no-undef': 'warn',
            'no-underscore-dangle': 'off',
            'no-unreachable': 'warn',
            'no-unused-expressions': 'off',

            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            'prefer-arrow-callback': 'error',
            'prettier/prettier': 'warn',
            'react/button-has-type': 'off',
            'react/destructuring-assignment': 'off',
            'react/forbid-prop-types': [0],
            'react/function-component-definition': 'off',
            'react/jsx-curly-newline': 'off',

            'react/jsx-filename-extension': [
                1,
                {
                    extensions: ['.js', '.jsx'],
                },
            ],

            'react/jsx-indent': ['error', 4],
            'react/jsx-indent-props': ['error', 4],
            'import/no-named-as-default': 'off',
            'react/jsx-one-expression-per-line': 'off',
            'react/jsx-props-no-spreading': 'off',
            'react/jsx-wrap-multilines': 'off',
            'react/jsx-uses-react': 1,
            'react/no-access-state-in-setstate': 'off',
            'react/no-array-index-key': 'warn',
            'react/no-render-return-value': 'warn',
            'react/no-unused-prop-types': 'warn',

            'react/prefer-stateless-function': [
                0,
                {
                    ignorePureComponents: true,
                },
            ],

            'react/prop-types': 'warn',
            'valid-typeof': 'warn',
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],

        extends: fixupConfigRules(
            compat.extends(
                'plugin:react-hooks/recommended',
                'plugin:@typescript-eslint/recommended',
                'plugin:react/recommended',
                'prettier',
            ),
        ),

        plugins: {
            formatjs,
            prettier: prettierPlugin,
            '@typescript-eslint': fixupPluginRules(typescriptEslint),
            import: importPlugin,
            'jsx-a11y': jsxA11y,
        },

        languageOptions: {
            globals: {
                after: 'readonly',
                afterEach: 'readonly',
                assert: 'readonly',
                before: 'readonly',
                beforeEach: 'readonly',
                context: 'readonly',
                cy: 'readonly',
                Cypress: 'readonly',
                describe: 'readonly',
                expect: 'readonly',
                it: 'readonly',
                localStorage: 'readonly',
                mount: 'readonly',
                shallow: 'readonly',
                sinon: 'readonly',
            },

            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: 'module',

            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },

                project: './tsconfig.json',
            },
        },

        rules: {
            'import/extensions': [
                'error',
                'ignorePackages',
                {
                    js: 'off',
                    jsx: 'off',
                    ts: 'off',
                    tsx: 'off',
                },
            ],

            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 0,
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/no-unused-expressions': 'error',

            camelcase: 'off',
            'class-methods-use-this': 'warn',
            'constructor-super': 'warn',
            'import/no-extraneous-dependencies': 'off',
            'import/no-named-as-default': 'warn',
            'import/no-unresolved': 'warn',
            'import/prefer-default-export': 'off',
            'jsx-a11y/anchor-is-valid': 'off',
            'jsx-a11y/click-events-have-key-events': 'off',
            'jsx-a11y/control-has-associated-label': 'off',
            'jsx-a11y/href-no-hash': 'off',
            'jsx-a11y/jsx-wrap-multilines': 'off',
            'jsx-a11y/label-has-associated-control': 'off',
            'jsx-a11y/label-has-for': 'warn',
            'jsx-a11y/no-noninteractive-element-interactions': 'off',
            'jsx-a11y/no-noninteractive-element-to-interactive-role': 'off',
            'linebreak-style': 'off',

            'max-len': [
                'warn',
                {
                    code: 200,
                },
            ],

            'no-bitwise': 'warn',
            'no-case-declarations': 'warn',

            'no-console': [
                'error',
                {
                    allow: ['warn', 'error'],
                },
            ],

            'no-const-assign': 'warn',
            'no-continue': 'warn',
            'no-nested-ternary': 'warn',
            'no-prototype-builtins': 'warn',
            'no-restricted-syntax': 'warn',
            'no-tabs': 'off',
            'no-this-before-super': 'warn',
            'no-undef': 'warn',
            'no-underscore-dangle': 'off',
            'no-unreachable': 'warn',
            'no-unused-expressions': 'off',

            'no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            'no-use-before-define': 0,
            'prettier/prettier': 'warn',
            'react/button-has-type': 'off',
            'react/destructuring-assignment': 'off',
            'react/forbid-prop-types': [1],
            'react/function-component-definition': 'off',
            'react/jsx-curly-newline': 'off',

            'react/jsx-filename-extension': [
                1,
                {
                    extensions: ['.js', '.jsx', '.tsx', '.ts'],
                },
            ],

            'react/jsx-indent': ['error', 4],
            'react/jsx-indent-props': ['error', 4],
            'react/jsx-one-expression-per-line': 'off',
            'react/jsx-props-no-spreading': 'off',
            'react/jsx-wrap-multilines': 'off',
            'react/no-access-state-in-setstate': 'off',
            'react/no-array-index-key': 'warn',
            'react/no-unused-prop-types': 'warn',

            'react/prefer-stateless-function': [
                0,
                {
                    ignorePureComponents: true,
                },
            ],

            'react/prop-types': 'off',
            'react/require-default-props': 'off',
            'valid-typeof': 'warn',
        },
    },
]);
