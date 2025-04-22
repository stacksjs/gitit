# Hooks

Gitit provides a hooks system that allows you to execute custom logic at specific points in the template cloning process. Hooks are powerful extension points that can be used to customize the behavior of Gitit without modifying its core functionality.

## Understanding Hooks

Hooks are functions that are called at specific stages of the Gitit workflow. They can be used to:

- Modify template content before or after extraction
- Run custom operations after cloning is complete
- Perform cleanup tasks
- Add custom analytics or logging
- Interact with external systems

## Available Hooks

Gitit provides the following hooks that you can tap into:

### Lifecycle Hooks

| Hook Name | Timing | Description |
| --- | --- | --- |
| `beforeDownload` | Before template download | Called before downloading the template |
| `afterDownload` | After template download | Called after the template has been downloaded |
| `beforeExtract` | Before template extraction | Called before extracting the template archive |
| `afterExtract` | After template extraction | Called after the template has been extracted |
| `beforeInstall` | Before dependency installation | Called before installing dependencies |
| `afterInstall` | After dependency installation | Called after dependencies have been installed |

## Configuring Hooks

Hooks can be configured in your `gitit.config.ts` file:

```typescript
// gitit.config.ts
export default {
  hooks: {
    beforeDownload: (template, options) => {
      console.log(`About to download template: ${template}`)
      return { template, options }
    },

    afterExtract: (result) => {
      console.log(`Template extracted to: ${result.dir}`)
      // You can modify files here if needed
      return result
    },

    afterInstall: async (result) => {
      console.log('Dependencies installed, running custom logic...')
      // Run custom commands, etc.
      return result
    }
  },

  // Other configuration options...
}
```

## Hook Function Signatures

Each hook has a specific signature that provides relevant context information:

### beforeDownload

```typescript
type BeforeDownloadHook = (
  template: string,
  options: DownloadTemplateOptions
) => Promise<{ template: string, options: DownloadTemplateOptions }> | { template: string, options: DownloadTemplateOptions }
```

This hook allows you to modify the template source and download options before the download begins.

### afterDownload

```typescript
type AfterDownloadHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult
```

This hook is called after the template has been downloaded but before it's extracted. The `result` object contains information about the downloaded template.

### beforeExtract

```typescript
type BeforeExtractHook = (
  result: DownloadTemplateResult,
  extractOptions: ExtractOptions
) => Promise<{ result: DownloadTemplateResult, extractOptions: ExtractOptions }> | { result: DownloadTemplateResult, extractOptions: ExtractOptions }
```

This hook is called before extracting the template archive, allowing you to modify extraction options.

### afterExtract

```typescript
type AfterExtractHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult
```

This hook is called after the template has been extracted to the target directory. This is a good place to modify template files.

### beforeInstall

```typescript
type BeforeInstallHook = (
  result: DownloadTemplateResult,
  installOptions: InstallOptions
) => Promise<{ result: DownloadTemplateResult, installOptions: InstallOptions }> | { result: DownloadTemplateResult, installOptions: InstallOptions }
```

This hook is called before installing dependencies, if the `install` option is enabled.

### afterInstall

```typescript
type AfterInstallHook = (
  result: DownloadTemplateResult
) => Promise<DownloadTemplateResult> | DownloadTemplateResult
```

This hook is called after dependencies have been installed. This is a good place to run post-install tasks.

## Hook Examples

Here are some practical examples of how to use hooks:

### Custom License Replacement

This hook replaces license information with your own details:

```typescript
// gitit.config.ts
import { access, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export default {
  hooks: {
    afterExtract: async (result) => {
      // Replace LICENSE file if it exists
      const licensePath = join(result.dir, 'LICENSE')
      try {
        const fileExists = await access(licensePath)
          .then(() => true)
          .catch(() => false)

        if (fileExists) {
          await writeFile(
            licensePath,
            `Copyright (c) ${new Date().getFullYear()} Your Name\n\nYour license text here...`
          )
        }
      }
      catch (error) {
        console.error('Error modifying license:', error)
      }

      return result
    }
  }
}
```

### Custom Git Initialization

Initialize a Git repository after cloning a template:

```typescript
// gitit.config.ts
import { execSync } from 'node:child_process'

export default {
  hooks: {
    afterExtract: async (result) => {
      try {
        console.log('Initializing Git repository...')
        execSync('git init', { cwd: result.dir, stdio: 'inherit' })
        execSync('git add .', { cwd: result.dir, stdio: 'inherit' })
        execSync('git commit -m "Initial commit from template"', {
          cwd: result.dir,
          stdio: 'inherit'
        })
      }
      catch (error) {
        console.error('Error initializing Git repository:', error)
      }

      return result
    }
  }
}
```

### Template Customization

Customize template files with project-specific information:

```typescript
// gitit.config.ts
import { readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { prompt } from 'enquirer'

export default {
  hooks: {
    afterExtract: async (result) => {
      // Get project information
      const { projectName, author, description } = await prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name',
          initial: basename(result.dir)
        },
        {
          type: 'input',
          name: 'author',
          message: 'Author name'
        },
        {
          type: 'input',
          name: 'description',
          message: 'Project description'
        }
      ])

      // Replace in package.json
      const packageJsonPath = join(result.dir, 'package.json')
      try {
        const packageData = JSON.parse(
          await readFile(packageJsonPath, 'utf8')
        )

        packageData.name = projectName
        packageData.author = author
        packageData.description = description

        await writeFile(
          packageJsonPath,
          JSON.stringify(packageData, null, 2)
        )
      }
      catch (error) {
        console.error('Error updating package.json:', error)
      }

      return result
    }
  }
}
```

## Accessing External Services

Hooks can interact with external services for various purposes:

```typescript
// gitit.config.ts
import { basename } from 'node:path'

export default {
  hooks: {
    afterExtract: async (result) => {
      // Send a notification that a new project was created
      try {
        await fetch('https://api.example.com/project-created', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: basename(result.dir),
            template: result.name,
            timestamp: new Date().toISOString()
          })
        })
      }
      catch (error) {
        console.error('Failed to send notification:', error)
      }

      return result
    }
  }
}
```

## Best Practices

When working with hooks, follow these best practices:

1. **Keep hooks focused**: Each hook should do one thing well
2. **Handle errors gracefully**: Always wrap hook logic in try/catch blocks
3. **Return the expected values**: Make sure to return the correct result from each hook
4. **Use async/await**: For operations that may take time, use async functions
5. **Respect user choices**: Don't override user configuration without good reason
6. **Provide feedback**: Log important information about what your hooks are doing
7. **Be idempotent**: Hooks should work correctly even if run multiple times

## Advanced: Hooks in Plugins

For more complex scenarios, consider creating a plugin that provides hooks. This allows for better organization and reuse:

```typescript
// my-gitit-plugin.ts
import type { GitItPlugin } from '@stacksjs/gitit'

const myPlugin: GitItPlugin = {
  name: 'my-gitit-plugin',
  version: '1.0.0',

  hooks: {
    afterExtract: async (result) => {
      // Plugin hook implementation
      return result
    }
  }
}

export default myPlugin
```

Then in your configuration:

```typescript
// gitit.config.ts
import myPlugin from './my-gitit-plugin'

export default {
  plugins: [myPlugin],

  // You can still define hooks directly
  hooks: {
    beforeDownload: (template, options) => {
      // Hook implementation
      return { template, options }
    }
  }
}
```

See the [Plugins](/advanced/plugins) documentation for more information on creating plugins.
