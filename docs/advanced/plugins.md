# Plugins

Gitit supports a plugin system that allows you to extend its functionality. Plugins can add new template sources, modify the behavior of existing commands, add new commands, or hook into various stages of the template cloning process.

## Plugin Architecture

Gitit plugins are JavaScript or TypeScript modules that export a specific interface. Plugins can be distributed as npm packages or local files.

### Plugin Interface

A basic Gitit plugin follows this structure:

```typescript
// my-gitit-plugin.ts
import type { GitItPlugin } from '@stacksjs/gitit'

const myPlugin: GitItPlugin = {
  name: 'my-gitit-plugin',
  version: '1.0.0',

  // Plugin functionality
  hooks: {
    // Hook implementations
  },

  providers: {
    // Custom template providers
  },

  commands: {
    // Custom commands
  }
}

export default myPlugin
```

## Installing Plugins

### From npm

To use a plugin published on npm:

```bash
# Install the plugin
npm install gitit-plugin-example --save-dev

# Add to your gitit.config.ts
```

```typescript
// gitit.config.ts
import examplePlugin from 'gitit-plugin-example'

export default {
  plugins: [
    examplePlugin,
    // More plugins...
  ],
  // Other configuration...
}
```

### Local Plugins

You can also use local plugins:

```typescript
// gitit.config.ts
import myLocalPlugin from './plugins/my-local-plugin.js'

export default {
  plugins: [
    myLocalPlugin,
    // More plugins...
  ],
  // Other configuration...
}
```

## Developing Plugins

### Creating a Basic Plugin

To create a Gitit plugin, start with this template:

```typescript
// my-gitit-plugin.ts
import type { GitItPlugin, TemplateInfo } from '@stacksjs/gitit'

const myPlugin: GitItPlugin = {
  name: 'my-gitit-plugin',
  version: '1.0.0',
  description: 'A plugin for Gitit that adds custom functionality',

  // Hook into various lifecycle events
  hooks: {
    beforeDownload: (template, options) => {
      console.log(`Downloading template: ${template}`)
      return { template, options }
    },

    afterDownload: (result) => {
      console.log(`Template downloaded to: ${result.dir}`)
      return result
    }
  },

  // Add custom template providers
  providers: {
    myCustomSource: (input, options) => {
      // Handle custom template source
      const info: TemplateInfo = {
        name: 'custom-template',
        tar: `https://example.com/templates/${input}.tar.gz`,
        // Other TemplateInfo properties...
      }
      return info
    }
  }
}

export default myPlugin
```

### Available Hooks

Plugins can hook into various stages of the Gitit lifecycle:

- `beforeDownload`: Called before template download starts
- `afterDownload`: Called after template download completes
- `beforeExtract`: Called before template extraction
- `afterExtract`: Called after template extraction
- `beforeInstall`: Called before dependencies are installed
- `afterInstall`: Called after dependencies are installed

Each hook receives relevant context and can modify the behavior of Gitit.

### Custom Template Providers

Plugins can add new template sources by implementing custom providers:

```typescript
providers: {
  myCompany: (input, options) => {
    // Parse input and generate template info
    return {
      name: `company-template-${input}`,
      tar: `https://internal.mycompany.com/templates/${input}.tar.gz`,
      // Other properties...
    }
  }
}
```

This would allow users to use templates with:

```bash
gitit myCompany:template-name my-project
```

## Plugin Configuration

Plugins can accept configuration options:

```typescript
// gitit.config.ts
import myPlugin from 'my-gitit-plugin'

export default {
  plugins: [
    [myPlugin, {
      option1: 'value1',
      option2: true
    }]
  ],
  // Other configuration...
}
```

In your plugin, access these options:

```typescript
// my-gitit-plugin.ts
import type { GitItPlugin } from '@stacksjs/gitit'

function createPlugin(options = {}) {
  return {
    name: 'my-gitit-plugin',
    // Access options.option1, options.option2, etc.

    hooks: {
      beforeDownload: (template, downloadOptions) => {
        if (options.option2) {
          // Do something based on configuration
        }
        return { template, options: downloadOptions }
      }
    }
  } as GitItPlugin
}

export default createPlugin
```

## Examples

### Template Transformer Plugin

This example plugin transforms templates by replacing variables:

```typescript
// gitit-template-transformer-plugin.ts
import type { GitItPlugin } from '@stacksjs/gitit'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const transformerPlugin: GitItPlugin = {
  name: 'gitit-template-transformer',
  version: '1.0.0',

  hooks: {
    afterExtract: async (result) => {
      const variables = {
        PROJECT_NAME: result.dir.split('/').pop(),
        TIMESTAMP: new Date().toISOString(),
        AUTHOR: process.env.USER || 'unknown'
      }

      // Find and process files with variables
      await processDirectory(result.dir, variables)

      return result
    }
  }
}

async function processDirectory(dir, variables) {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      await processDirectory(fullPath, variables)
    }
    else if (entry.isFile()) {
      await processFile(fullPath, variables)
    }
  }
}

async function processFile(file, variables) {
  // Skip binary files
  if (isBinaryPath(file))
    return

  try {
    let content = await readFile(file, 'utf8')
    let changed = false

    // Replace variables in format {{ VARIABLE_NAME }}
    for (const [name, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${name}\\s*\\}\\}`, 'g')
      if (regex.test(content)) {
        content = content.replace(regex, value)
        changed = true
      }
    }

    if (changed) {
      await writeFile(file, content, 'utf8')
    }
  }
  catch (error) {
    console.error(`Error processing file ${file}:`, error)
  }
}

function isBinaryPath(filePath) {
  // Simple check for binary files
  const ext = extname(filePath).toLowerCase()
  return ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.zip', '.gz'].includes(ext)
}

export default transformerPlugin
```

## Publishing Plugins

To publish your plugin to npm:

1. Create a package with an appropriate name (e.g., `gitit-plugin-*`)
2. Set up your `package.json` file:

```json
{
  "name": "gitit-plugin-example",
  "version": "1.0.0",
  "description": "Example plugin for Gitit",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "keywords": ["gitit", "gitit-plugin"],
  "peerDependencies": {
    "@stacksjs/gitit": "^1.0.0"
  }
}
```

3. Build your plugin (transpile TypeScript if needed)
4. Publish to npm with `npm publish` _(or `bun publish`)_

## Best Practices

When developing Gitit plugins:

1. **Follow naming conventions**: Use `gitit-plugin-*` for npm packages
2. **Document your plugin**: Include clear documentation on usage and options
3. **Handle errors gracefully**: Don't let your plugin crash the main process
4. **Keep it focused**: Each plugin should have a clear purpose
5. **Use TypeScript**: Leverage type checking for more robust plugins
6. **Test thoroughly**: Ensure your plugin works with different Gitit workflows
