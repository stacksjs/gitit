<p align="center"><img src=".github/art/cover.jpg" alt="Social Card of this repo"></p>

[![npm version][npm-version-src]][npm-version-href]
[![GitHub Actions][github-actions-src]][github-actions-href]
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
<!-- [![npm downloads][npm-downloads-src]][npm-downloads-href] -->
<!-- [![Codecov][codecov-src]][codecov-href] -->

# gitit

A powerful template and project scaffolding tool to help kick-start development of your next project.

## Features

Gitit comes with the following features:

- 🚀 **Fast Template Cloning** _Clone templates from GitHub, GitLab, Bitbucket, and more_
- 💪 **Fully Typed APIs** _Written in TypeScript for a great developer experience_
- 📦 **Zero Configuration** _Works out of the box with sensible defaults_
- 🔄 **Offline Support** _Use cached templates when offline_
- 🛠️ **Customizable** _Configure templates with various options_
- 🧩 **Post-Installation Commands** _Run custom commands after cloning_
- 🔑 **Private Repository Support** _Authentication for private templates_
- 🖥️ **Interactive Shell** _Open a shell in your newly created project_

## Get Started

```bash
# Install globally
bun install -g @stacksjs/gitit

# or use directly with bunx
bunx @stacksjs/gitit github:user/repo my-project
```

## Usage

```bash
# Basic usage
gitit github:user/repo my-project

# With options
gitit github:user/repo my-project --install --shell

# Clone with custom command
gitit github:user/repo my-project --command "npm run dev"

# Use offline cached template
gitit github:user/repo my-project --offline

# Clone to a specific directory
gitit github:user/repo ./path/to/project
```

## Available Options

| Option | Description |
|--------|-------------|
| `--force` | Clone to existing directory even if it exists |
| `--force-clean` | Remove any existing directory or file recursively before cloning |
| `--shell` | Open a new shell with current working directory |
| `--install` | Install dependencies after cloning |
| `--verbose` | Show verbose debugging info |
| `--command` | Custom command to run after template is cloned |
| `--auth` | Custom Authorization token for private repositories |
| `--cwd` | Set current working directory to resolve dirs relative to it |
| `--offline` | Do not attempt to download and use cached version |
| `--prefer-offline` | Use cache if exists otherwise try to download |

## Library Usage

Gitit can also be used programmatically in your Node.js or Bun applications:

```js
import { downloadTemplate } from '@stacksjs/gitit'

// Basic usage
await downloadTemplate('github:user/repo')

// With options
const result = await downloadTemplate('github:user/repo', {
  dir: './my-project',
  force: true,
  install: true,
  offline: false,
  preferOffline: true
})

console.log(`Downloaded to ${result.dir}`)
```

### API Reference

#### `downloadTemplate(source, options)`

The main function for downloading templates.

- **source**: `string` - Template source (e.g., "github:user/repo")
- **options**: `DownloadTemplateOptions` - Configuration options

```ts
interface DownloadTemplateOptions {
  provider?: string // Specify provider (github, gitlab, etc.)
  force?: boolean // Force clone even if directory exists
  forceClean?: boolean // Remove existing directory before cloning
  offline?: boolean // Use cached version only
  preferOffline?: boolean // Prefer cache if exists
  dir?: string // Target directory
  registry?: false | string // Registry URL or false to disable
  cwd?: string // Current working directory
  auth?: string // Auth token for private repositories
  install?: boolean // Install dependencies after download
  silent?: boolean // Hide installation output
  hooks?: Hooks // Custom lifecycle hooks
}
```

#### Return value

```ts
interface DownloadTemplateResult {
  dir: string // The directory where template was extracted
  source: string // Original source string
  name: string // Template name
  tar: string // Tarball URL
  version?: string // Template version
  url?: string // Repository URL
  // ... additional properties
}
```

#### Advanced: Custom Plugins

You can extend gitit's functionality using plugins:

```js
import { downloadTemplate } from '@stacksjs/gitit'

const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  hooks: {
    afterExtract: (result) => {
      console.log(`Template extracted to ${result.dir}`)
      return result
    }
  },
  providers: {
    myCustomSource: (input, options) => {
      // Custom template provider logic
      return {
        name: 'my-template',
        tar: 'https://example.com/template.tar.gz'
      }
    }
  }
}

await downloadTemplate('mycustom:template', {
  plugins: [myPlugin]
})
```

## Changelog

Please see our [releases](https://github.com/stackjs/gitit/releases) page for more information on what has changed recently.

## Contributing

Please see [CONTRIBUTING](.github/CONTRIBUTING.md) for details.

## Community

For help, discussion about best practices, or any other conversation that would benefit from being searchable:

[Discussions on GitHub](https://github.com/stacksjs/gitit/discussions)

For casual chit-chat with others using this package:

[Join the Stacks Discord Server](https://discord.gg/stacksjs)

## Postcardware

"Software that is free, but hopes for a postcard." We love receiving postcards from around the world showing where Stacks is being used! We showcase them on our website too.

Our address: Stacks.js, 12665 Village Ln #2306, Playa Vista, CA 90094, United States 🌎

## Sponsors

We would like to extend our thanks to the following sponsors for funding Stacks development. If you are interested in becoming a sponsor, please reach out to us.

- [JetBrains](https://www.jetbrains.com/)
- [The Solana Foundation](https://solana.com/)

## License

The MIT License (MIT). Please see [LICENSE](LICENSE.md) for more information.

Made with 💙

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/@stacksjs/gitit?style=flat-square
[npm-version-href]: https://npmjs.com/package/@stacksjs/gitit
[github-actions-src]: https://img.shields.io/github/actions/workflow/status/stacksjs/gitit/ci.yml?style=flat-square&branch=main
[github-actions-href]: https://github.com/stacksjs/gitit/actions?query=workflow%3Aci

<!-- [codecov-src]: https://img.shields.io/codecov/c/gh/stacksjs/gitit/main?style=flat-square
[codecov-href]: https://codecov.io/gh/stacksjs/gitit -->
