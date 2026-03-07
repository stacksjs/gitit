import type { BunPressConfig } from 'bunpress'

const config: BunPressConfig = {
  name: 'gitit',
  description: 'A powerful template and project scaffolding tool for GitHub, GitLab, and Bitbucket',
  url: 'https://gitit.sh',

  nav: [
    { text: 'Guide', link: '/guide/introduction' },
    { text: 'Providers', link: '/providers/github' },
    { text: 'API', link: '/api/reference' },
    { text: 'GitHub', link: 'https://github.com/stacksjs/gitit' },
  ],

  sidebar: {
    '/guide/': [
      {
        text: 'Getting Started',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick Start', link: '/guide/quick-start' },
        ],
      },
    ],
    '/providers/': [
      {
        text: 'Template Providers',
        items: [
          { text: 'GitHub', link: '/providers/github' },
          { text: 'GitLab', link: '/providers/gitlab' },
          { text: 'Bitbucket', link: '/providers/bitbucket' },
          { text: 'Custom Registries', link: '/providers/custom-registries' },
        ],
      },
    ],
    '/features/': [
      {
        text: 'Features',
        items: [
          { text: 'Template Downloads', link: '/features/template-downloads' },
          { text: 'Monorepo Support', link: '/features/monorepo-support' },
          { text: 'Authentication', link: '/features/authentication' },
          { text: 'Caching', link: '/features/caching' },
        ],
      },
    ],
    '/advanced/': [
      {
        text: 'Advanced',
        items: [
          { text: 'Configuration', link: '/advanced/configuration' },
          { text: 'Custom Providers', link: '/advanced/custom-providers' },
          { text: 'Performance', link: '/advanced/performance' },
          { text: 'CI/CD Integration', link: '/advanced/ci-cd' },
        ],
      },
    ],
    '/api/': [
      {
        text: 'API Reference',
        items: [
          { text: 'downloadTemplate', link: '/api/reference' },
          { text: 'Plugins', link: '/api/plugins' },
        ],
      },
    ],
  },

  themeConfig: {
    colors: {
      primary: '#f97316',
    },
  },
}

export default config
