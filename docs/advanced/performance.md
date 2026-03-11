# Performance Optimization

gitit is designed for speed, but there are many ways to further optimize template downloads and processing. This guide covers performance tuning techniques.

## Benchmarks

gitit's performance compared to alternatives:

| Tool | Cold Download | Cached Download | Memory Usage |
|------|---------------|-----------------|--------------|
| gitit | ~1.2s | ~0.1s | ~25MB |
| degit | ~2.5s | N/A | ~45MB |
| git clone | ~4.0s | N/A | ~80MB+ |

## Caching Strategies

### Enable Prefer-Offline

Use cached versions when available:

```bash
gitit stacksjs/starter --prefer-offline
```

```typescript
await downloadTemplate('stacksjs/starter', {
  preferOffline: true,
})
```

### Pre-Warm Cache

Cache templates before they're needed:

```typescript
import { downloadTemplate, cache } from 'gitit'

// Pre-warm commonly used templates
const templates = [
  'stacksjs/starter',
  'stacksjs/api-template',
  'stacksjs/vue-template',
]

await Promise.all(
  templates.map((t) =>
    downloadTemplate(t, { cacheOnly: true })
  )
)
```

### Cache on SSD

Ensure cache directory is on SSD:

```bash
export GITIT_CACHE_DIR=/ssd/cache/gitit
```

## Parallel Downloads

### Multiple Templates

Download multiple templates in parallel:

```typescript
import { downloadTemplate } from 'gitit'

const templates = [
  { source: 'stacksjs/api', dir: './api' },
  { source: 'stacksjs/web', dir: './web' },
  { source: 'stacksjs/shared', dir: './shared' },
]

const results = await Promise.all(
  templates.map(({ source, dir }) =>
    downloadTemplate(source, { dir })
  )
)
```

### Batch Operations

```typescript
import { batchDownload } from 'gitit'

const results = await batchDownload([
  { source: 'stacksjs/api', dir: './api' },
  { source: 'stacksjs/web', dir: './web' },
], {
  concurrency: 4, // Max parallel downloads
  continueOnError: true,
})
```

## Network Optimization

### Connection Pooling

```typescript
// gitit.config.ts
export default {
  http: {
    keepAlive: true,
    maxSockets: 10,
    timeout: 30000,
  },
}
```

### Compression

Enable gzip/brotli compression:

```typescript
export default {
  http: {
    compress: true,
    acceptEncoding: 'gzip, br',
  },
}
```

### Retry Strategy

Configure smart retries:

```typescript
export default {
  retries: {
    count: 3,
    delay: 1000,
    backoff: 'exponential', // or 'linear', 'fixed'
    retryOn: [408, 429, 500, 502, 503, 504],
  },
}
```

## Extraction Optimization

### Streaming Extraction

gitit uses streaming extraction by default:

```typescript
await downloadTemplate('stacksjs/starter', {
  streaming: true, // Default
})
```

### Exclude Unnecessary Files

Skip files you don't need:

```typescript
await downloadTemplate('stacksjs/starter', {
  exclude: [
    '.github',
    'docs',
    '*.md',
    'tests',
  ],
})
```

### Filter by Pattern

Only extract matching files:

```typescript
await downloadTemplate('stacksjs/monorepo/packages/core', {
  include: ['src/**', 'package.json', 'tsconfig.json'],
})
```

## Memory Management

### Large Templates

For large templates, use streaming:

```typescript
await downloadTemplate('org/large-repo', {
  streaming: true,
  maxBuffer: 100 _ 1024 _ 1024, // 100MB
})
```

### Cleanup

Clean up after operations:

```typescript
import { cache } from 'gitit'

// Prune old cache entries
await cache.prune({ maxAge: 7 _ 24 _ 60 _ 60 _ 1000 })

// Limit cache size
await cache.prune({ maxSize: 1024 _ 1024 _ 1024 }) // 1GB
```

## CI/CD Performance

### GitHub Actions

```yaml

- name: Cache gitit

  uses: actions/cache@v4
  with:
    path: ~/.cache/gitit
    key: gitit-${{ runner.os }}-${{ hashFiles('**/gitit.config.ts') }}
    restore-keys: |
      gitit-${{ runner.os }}-

- name: Download template

  run: gitit stacksjs/starter ./app --prefer-offline
```

### Parallel Jobs

```yaml
jobs:
  download-templates:
    strategy:
      matrix:
        template: [api, web, shared]
    steps:

      - run: gitit stacksjs/${{ matrix.template }} ./${{ matrix.template }}

```

### Pre-Built Cache

Create a reusable cache artifact:

```yaml
# Cache build job

- name: Pre-warm cache

  run: |
    gitit stacksjs/starter --cache-only
    gitit stacksjs/api --cache-only
    gitit stacksjs/shared --cache-only

- name: Upload cache

  uses: actions/upload-artifact@v4
  with:
    name: gitit-cache
    path: ~/.cache/gitit
```

## Profiling

### Enable Performance Logging

```bash
DEBUG=gitit:perf gitit stacksjs/starter
```

Output:

```
gitit:perf resolve: 45ms
gitit:perf download: 850ms
gitit:perf extract: 120ms
gitit:perf total: 1015ms
```

### Programmatic Metrics

```typescript
import { downloadTemplate, metrics } from 'gitit'

metrics.enable()

await downloadTemplate('stacksjs/starter', { dir: './app' })

console.log(metrics.get())
// {
//   resolve: 45,
//   download: 850,
//   extract: 120,
//   total: 1015,
//   cacheHit: false,
// }
```

## Configuration Presets

### Fast Mode

Optimized for speed:

```typescript
export default {
  preset: 'fast',
  // Equivalent to:
  // preferOffline: true,
  // streaming: true,
  // compress: true,
  // keepAlive: true,
}
```

### Minimal Mode

Lowest resource usage:

```typescript
export default {
  preset: 'minimal',
  // Equivalent to:
  // maxBuffer: 50 _ 1024 _ 1024,
  // maxSockets: 2,
  // streaming: true,
}
```

## Best Practices

1. **Always use cache**: Enable `preferOffline` for repeated downloads
2. **Pin versions**: Use specific refs for better cache hits
3. **Exclude extras**: Skip docs, tests, and .github folders
4. **Parallelize**: Download multiple templates concurrently
5. **Monitor**: Use profiling to identify bottlenecks
6. **CI caching**: Persist cache between CI runs
7. **SSD storage**: Use fast storage for cache directory

## Related

- [Caching](/features/caching) - Cache configuration
- [CI/CD Integration](/advanced/ci-cd) - CI optimization
- [Configuration](/advanced/configuration) - Full configuration options
