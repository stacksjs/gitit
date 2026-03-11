# CI/CD Integration

gitit integrates seamlessly with CI/CD platforms for automated template downloads, scaffolding, and project generation. This guide covers integration patterns for popular platforms.

## GitHub Actions

### Basic Usage

```yaml
name: Setup Project
on: workflow_dispatch

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:

      - uses: actions/checkout@v4

      - name: Setup Bun

        uses: oven-sh/setup-bun@v2

      - name: Download template

        run: bunx gitit stacksjs/starter ./my-app

      - name: Install dependencies

        run: cd my-app && bun install
```

### With Caching

```yaml
name: Setup with Cache
on: workflow_dispatch

jobs:
  setup:
    runs-on: ubuntu-latest
    steps:

      - uses: actions/checkout@v4

      - name: Setup Bun

        uses: oven-sh/setup-bun@v2

      - name: Cache gitit

        uses: actions/cache@v4
        with:
          path: ~/.cache/gitit
          key: gitit-${{ runner.os }}-${{ github.sha }}
          restore-keys: |
            gitit-${{ runner.os }}-

      - name: Download template

        run: bunx gitit stacksjs/starter ./my-app --prefer-offline
```

### Private Repositories

```yaml

- name: Download private template

  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: bunx gitit private-org/private-template ./my-app
```

### Matrix Builds

```yaml
jobs:
  generate-projects:
    strategy:
      matrix:
        template:

          - name: api

            source: stacksjs/api-template

          - name: web

            source: stacksjs/web-template

          - name: mobile

            source: stacksjs/mobile-template
    steps:

      - run: bunx gitit ${{ matrix.template.source }} ./${{ matrix.template.name }}

```

### Composite Action

Create a reusable action:

```yaml
# .github/actions/gitit-download/action.yml
name: Download Template
description: Download a template using gitit

inputs:
  source:
    description: Template source (e.g., owner/repo)
    required: true
  destination:
    description: Destination directory
    required: true
  token:
    description: GitHub token for private repos
    required: false

runs:
  using: composite
  steps:

    - name: Setup Bun

      uses: oven-sh/setup-bun@v2

    - name: Cache gitit

      uses: actions/cache@v4
      with:
        path: ~/.cache/gitit
        key: gitit-${{ runner.os }}

    - name: Download

      shell: bash
      env:
        GITHUB_TOKEN: ${{ inputs.token }}
      run: bunx gitit ${{ inputs.source }} ${{ inputs.destination }} --prefer-offline
```

Usage:

```yaml

- uses: ./.github/actions/gitit-download

  with:
    source: stacksjs/starter
    destination: ./my-app
    token: ${{ secrets.GITHUB_TOKEN }}
```

## GitLab CI

### Basic Pipeline

```yaml
stages:

  - setup

download-template:
  stage: setup
  image: oven/bun:latest
  script:

    - bunx gitit stacksjs/starter ./my-app

  artifacts:
    paths:

      - my-app/

```

### With Caching

```yaml
download-template:
  stage: setup
  image: oven/bun:latest
  cache:
    key: gitit-cache
    paths:

      - .cache/gitit/

  variables:
    GITIT_CACHE_DIR: .cache/gitit
  script:

    - bunx gitit stacksjs/starter ./my-app --prefer-offline

```

### Private Repositories

```yaml
download-private:
  stage: setup
  image: oven/bun:latest
  variables:
    GITLAB_TOKEN: $CI_JOB_TOKEN
  script:

    - bunx gitit gitlab:private-group/template ./my-app

```

## Bitbucket Pipelines

```yaml
pipelines:
  default:

    - step:

        name: Download Template
        image: oven/bun:latest
        caches:

          - gitit

        script:

          - bunx gitit bitbucket:org/template ./my-app

definitions:
  caches:
    gitit: ~/.cache/gitit
```

## CircleCI

```yaml
version: 2.1

jobs:
  download-template:
    docker:

      - image: oven/bun:latest

    steps:

      - checkout
      - restore_cache:

          keys:

            - gitit-v1-{{ .Branch }}
            - gitit-v1-
      - run:

          name: Download template
          command: bunx gitit stacksjs/starter ./my-app --prefer-offline

      - save_cache:

          key: gitit-v1-{{ .Branch }}
          paths:

            - ~/.cache/gitit

```

## Jenkins

### Declarative Pipeline

```groovy
pipeline {
    agent {
        docker {
            image 'oven/bun:latest'
        }
    }

    stages {
        stage('Download Template') {
            steps {
                sh 'bunx gitit stacksjs/starter ./my-app'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'my-app/**', fingerprint: true
        }
    }
}
```

### With Credentials

```groovy
stage('Download Private Template') {
    environment {
        GITHUB_TOKEN = credentials('github-token')
    }
    steps {
        sh 'bunx gitit private-org/template ./my-app'
    }
}
```

## Azure DevOps

```yaml
trigger:

  - main

pool:
  vmImage: ubuntu-latest

steps:

  - task: UseNode@1

    inputs:
      version: '20.x'

  - script: npm install -g bun

    displayName: Install Bun

  - script: bunx gitit stacksjs/starter ./my-app

    displayName: Download Template
    env:
      GITHUB_TOKEN: $(GITHUB_TOKEN)

  - task: PublishPipelineArtifact@1

    inputs:
      targetPath: my-app
      artifact: project
```

## Docker

### Dockerfile

```dockerfile
FROM oven/bun:latest

# Install gitit globally
RUN bun install -g gitit

# Download template during build
ARG TEMPLATE=stacksjs/starter
RUN gitit ${TEMPLATE} /app

WORKDIR /app
RUN bun install

CMD ["bun", "run", "start"]
```

### Multi-Stage Build

```dockerfile
# Stage 1: Download template
FROM oven/bun:latest AS template
ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}
RUN bunx gitit stacksjs/starter /template

# Stage 2: Build application
FROM oven/bun:latest AS builder
COPY --from=template /template /app
WORKDIR /app
RUN bun install
RUN bun run build

# Stage 3: Production
FROM oven/bun:latest
COPY --from=builder /app/dist /app
WORKDIR /app
CMD ["bun", "run", "start"]
```

## Monorepo Scaffolding

Generate multiple projects from templates:

```yaml
name: Scaffold Monorepo
on: workflow_dispatch

jobs:
  scaffold:
    runs-on: ubuntu-latest
    steps:

      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v2

      - name: Download apps

        run: |
          bunx gitit stacksjs/api-template ./apps/api
          bunx gitit stacksjs/web-template ./apps/web
          bunx gitit stacksjs/mobile-template ./apps/mobile

      - name: Download packages

        run: |
          bunx gitit stacksjs/shared-types ./packages/types
          bunx gitit stacksjs/shared-utils ./packages/utils

      - name: Setup workspace

        run: |
          bun install
          bun run setup
```

## Environment-Specific Templates

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        environment: [development, staging, production]
    steps:

      - name: Download environment config

        run: |
          bunx gitit org/configs/${{ matrix.environment }} ./config

      - name: Deploy

        run: ./scripts/deploy.sh ${{ matrix.environment }}
```

## Best Practices

1. **Always cache**: Persist gitit cache between runs
2. **Use --prefer-offline**: Faster builds with cached templates
3. **Pin versions**: Use specific refs for reproducible builds
4. **Secure tokens**: Use CI secrets for authentication
5. **Parallel downloads**: Use matrix builds for multiple templates
6. **Artifact storage**: Save generated projects as artifacts
7. **Fail fast**: Use `--offline` when cache is required

## Related

- [Caching](/features/caching) - Cache configuration
- [Authentication](/features/authentication) - Token setup
- [Performance](/advanced/performance) - Optimization techniques
