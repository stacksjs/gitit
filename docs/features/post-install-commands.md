# Post-Install Commands

Gitit allows you to execute custom commands after a template is cloned, helping you automate your workflow and get projects up and running quickly.

## Basic Usage

You can specify a command to run after cloning using the `--command` option:

```bash
gitit github:user/repo my-project --command "npm run dev"
```

This will:

1. Clone the template from github:user/repo
2. Extract it to the my-project directory
3. Execute `npm run dev` in the newly created project directory

## Use Cases

Post-install commands are useful for various scenarios:

### Starting Development Servers

Immediately start a development server after cloning:

```bash
gitit github:user/vue-app my-vue-app --command "npm run dev"
```

### Running Setup Scripts

Execute initialization or customization scripts:

```bash
gitit github:user/starter my-project --command "./setup.sh"
```

### Opening Editors

Launch your favorite editor or IDE:

```bash
gitit github:user/repo my-project --command "code ."
```

### Chaining Multiple Commands

You can chain multiple commands using shell syntax:

```bash
gitit github:user/repo my-project --command "npm install && npm run build && npm run dev"
```

## Environment Variables

Post-install commands have access to the following environment variables:

- `GITIT_TEMPLATE`: The template that was cloned
- `GITIT_DIR`: The directory where the template was extracted
- `GITIT_PROVIDER`: The provider of the template (github, gitlab, etc.)

Example of using these variables:

```bash
gitit github:user/repo my-project --command "echo 'Cloned $GITIT_TEMPLATE to $GITIT_DIR'"
```

## Configuration File

You can also specify a default post-install command in your `gitit.config.ts` file:

```typescript
// gitit.config.ts
export default {
  command: 'npm install && npm run dev',
  // other options...
}
```

## Combining with Other Options

Post-install commands work well when combined with other Gitit options:

```bash
gitit github:user/repo my-project --install --command "npm run dev"
```

This will install dependencies first (via the `--install` flag) and then run the development server.

## Security Considerations

Be cautious when running post-install commands, especially with templates from untrusted sources. Always review the template code before executing any commands.
