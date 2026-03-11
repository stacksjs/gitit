# Introduction

Gitit is a powerful template and project scaffolding tool that helps you quickly bootstrap new projects from templates hosted on GitHub, GitLab, Bitbucket, and custom registries.

## Features

- **Fast Template Cloning** - Clone templates from multiple providers
- **Fully Typed APIs** - Written in TypeScript for a great developer experience
- **Zero Configuration** - Works out of the box with sensible defaults
- **Offline Support** - Use cached templates when offline
- **Customizable** - Configure templates with various options
- **Post-Installation Commands** - Run custom commands after cloning
- **Private Repository Support** - Authentication for private templates
- **Interactive Shell** - Open a shell in your newly created project

## Supported Providers

| Provider | Prefix | Example |
|----------|--------|---------|
| GitHub | `github:` | `github:user/repo` |
| GitLab | `gitlab:` | `gitlab:user/repo` |
| Bitbucket | `bitbucket:` | `bitbucket:user/repo` |
| Custom | URL | `<https://example.com/repo>` |

## Quick Example

```bash
# Clone a GitHub template
gitit github:stacksjs/ts-starter my-project

# Clone with options
gitit github:user/repo my-project --install --shell
```

## When to Use Gitit

Gitit is perfect for:

- **Project Scaffolding** - Bootstrap new projects from templates
- **Internal Templates** - Share templates across your organization
- **CI/CD Pipelines** - Automate project creation in workflows
- **Development Tools** - Build custom scaffolding tools

## Getting Started

1. [Install gitit](/guide/installation)
2. [Follow the Quick Start](/guide/quick-start)
3. [Explore GitHub templates](/providers/github)

## Community

- [GitHub Discussions](https://github.com/stacksjs/gitit/discussions)
- [Discord](https://discord.gg/stacksjs)
