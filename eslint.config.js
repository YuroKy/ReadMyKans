import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: ['dist/', 'dev-dist/', 'public/', 'node_modules/', 'playwright-report/', 'test-results/'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  pluginVue.configs['flat/recommended'],
  {
    // <script setup lang="ts"> у .vue парситься typescript-eslint-парсером
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
    },
  },
  {
    rules: {
      // Повноширинні пробілі (U+3000) у японських текстах (data/library.ts,
      // data/defaultStory.ts) — навмисні: чанкінг ріже текст по них.
      'no-irregular-whitespace': ['error', { skipStrings: true, skipTemplates: true, skipRegExps: true }],
      // Порожній catch — прийнятий у проєкті патерн graceful degradation
      // навколо Web Speech / setPointerCapture, які кидають у різних браузерах.
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Проєкт без форматера; компактні однорядкові теги в шаблонах — свідомий
      // стиль, тому ці суто форматувальні правила вимкнені.
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['scripts/**/*.mjs', 'vite.config.ts', 'playwright.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
)
