# Custom Registries

Gitit supports custom template registries for organizations that want to host their own templates.

## Using Custom Registries

```bash
# Direct URL
gitit https://templates.mycompany.com/repo my-project

# With registry option
gitit mytemplate --registry https://templates.mycompany.com
```

## Registry URL Format

Custom registries should provide tarballs at predictable URLs:

```
https://registry.example.com/{name}/{version}.tar.gz
https://registry.example.com/{name}/latest.tar.gz
```

## Configuration

### Project Configuration

Create a `.gititrc` or `gitit.config.ts`:

```ts
// gitit.config.ts
export default {
  registry: 'https://templates.mycompany.com',
  auth: process.env.REGISTRY_TOKEN,
}
```

### Environment Variables

```bash
# Set default registry
export GITIT_REGISTRY=https://templates.mycompany.com

# Registry authentication
export GITIT_REGISTRY_AUTH=your_token
```

## Custom Providers

Create custom template providers using the plugin system:

```ts
import { downloadTemplate } from '@stacksjs/gitit'

const myProvider = {
  name: 'my-provider',
  version: '1.0.0',
  providers: {
    'mycompany': async (input, options) => {
      const [, name] = input.split(':')
      return {
        name,
        tar: `https://templates.mycompany.com/${name}/latest.tar.gz`,
        headers: {
          Authorization: `Bearer ${options.auth}`,
        },
      }
    },
  },
}

await downloadTemplate('mycompany:starter-template', {
  plugins: [myProvider],
  dir: './my-project',
})
```

## Self-Hosted Registry

### Simple File Server

Host templates as tarballs on any web server:

```
/templates/
├── ts-starter/
│   └── latest.tar.gz
├── react-starter/
│   └── latest.tar.gz
└── vue-starter/
    └── latest.tar.gz
```

### With Versioning

```
/templates/
├── ts-starter/
│   ├── 1.0.0.tar.gz
│   ├── 1.1.0.tar.gz
│   └── latest.tar.gz -> 1.1.0.tar.gz
```

### API-Based Registry

Create a registry API that returns template metadata:

```ts
// GET /api/templates/:name
{
  "name": "ts-starter",
  "version": "1.1.0",
  "tar": "https://cdn.example.com/ts-starter-1.1.0.tar.gz",
  "description": "TypeScript starter template"
}
```

## Authentication

### Bearer Token

```bash
gitit mycompany:template --auth "Bearer your_token"
```

### Basic Auth

```bash
gitit mycompany:template --auth "username:password"
```

### Custom Headers

```ts
await downloadTemplate('https://templates.example.com/starter.tar.gz', {
  headers: {
    'X-API-Key': 'your-api-key',
    'Authorization': 'Bearer token',
  },
})
```

## Library Usage

```ts
import { downloadTemplate } from '@stacksjs/gitit'

// Disable default registry
await downloadTemplate('https://custom.example.com/template.tar.gz', {
  registry: false, // Don't use npm registry
  dir: './my-project',
})

// Use custom registry
await downloadTemplate('my-template', {
  registry: 'https://templates.mycompany.com',
  auth: process.env.REGISTRY_TOKEN,
})
```

## Enterprise Considerations

### Security

- Use HTTPS for all registry URLs
- Implement proper authentication
- Validate template contents before extraction
- Consider signing templates

### Performance

- Use CDN for template distribution
- Implement caching headers
- Support conditional requests (ETag, If-Modified-Since)

### Monitoring

- Log template downloads
- Track popular templates
- Monitor for errors
