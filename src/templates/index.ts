import type { TemplateInfo } from '../types'

/**
 * Built-in templates, embedded directly (rather than read from disk at
 * runtime) so they resolve correctly no matter how gitit is invoked —
 * from source, from a bundled `dist/bin/cli.js`, or via `bunx`. A
 * cwd-relative or import.meta.url-relative file lookup breaks under at
 * least one of those (see stacksjs/gitit history).
 */
export const localTemplates: Record<string, TemplateInfo> = {
  maizzle: {
    name: 'maizzle',
    defaultDir: 'maizzle',
    url: 'https://github.com/maizzle/maizzle',
    tar: 'https://codeload.github.com/maizzle/maizzle/tar.gz/refs/heads/master',
  },
  nitro: {
    name: 'nitro',
    defaultDir: 'nitro-app',
    url: 'https://nitro.unjs.io',
    tar: 'https://codeload.github.com/unjs/nitro/tar.gz/refs/heads/starter',
  },
  nuxt: {
    name: 'nuxt',
    defaultDir: 'nuxt-app',
    url: 'https://v3.nuxtjs.org',
    tar: 'https://codeload.github.com/nuxt/starter/tar.gz/refs/heads/v3',
  },
  stacks: {
    name: 'stacks',
    defaultDir: 'my-project',
    url: 'https://stacks.ow3.org',
    tar: 'https://codeload.github.com/stacksjs/stacks/tar.gz/refs/heads/main',
  },
  'unjs-template': {
    name: 'unjs-template',
    defaultDir: 'mylib',
    url: 'https://github.com/unjs/template',
    tar: 'https://codeload.github.com/unjs/template/tar.gz/refs/heads/main',
  },
  unjs: {
    name: 'unjs-template',
    defaultDir: 'mylib',
    url: 'https://github.com/unjs/template',
    tar: 'https://codeload.github.com/unjs/template/tar.gz/refs/heads/main',
  },
}
