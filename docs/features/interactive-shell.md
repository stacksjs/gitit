# Interactive Shell

Gitit provides a convenient feature to open an interactive shell in your newly created project directory after cloning a template. This can help you quickly start working with your new project without having to manually navigate to the directory.

## Basic Usage

To use the interactive shell feature, add the `--shell` flag when cloning a template:

```bash
gitit github:user/repo my-project --shell
```

This will:

1. Clone the template repository
2. Extract it to the `my-project` directory
3. Open a new shell session in that directory

## How It Works

Under the hood, Gitit uses your default shell environment to open a new shell session. The process is:

1. The template is downloaded and extracted
2. Gitit determines your current shell (from `process.env.SHELL` or defaults to `/bin/bash` on Unix and `cmd.exe` on Windows)
3. It spawns a new shell process in the target directory
4. Control is transferred to the new shell session
5. When you exit the shell, you return to the original session

## Shell Environment

The shell opened by Gitit is a fully functional environment with:

- The working directory already set to your new project directory
- Access to all your normal shell configurations (from `.bashrc`, `.zshrc`, etc.)
- All environment variables from your current session

## Combining with Other Options

The `--shell` option works well when combined with other Gitit features:

```bash
# Clone a template, install dependencies, and open a shell
gitit github:user/repo my-project --install --shell

# Clone a template, run a custom command, and open a shell
gitit github:user/repo my-project --command "npm run setup" --shell
```

In these cases, the shell opens after any other post-clone operations are completed.

## Configuration

You can set the interactive shell feature as a default in your `gitit.config.ts` file:

```typescript
// gitit.config.ts
export default {
  shell: true,
  // other options...
}
```

With this configuration, Gitit will always open a shell after cloning a template, unless explicitly disabled with `--no-shell`.

## Use Cases

The interactive shell feature is particularly useful for:

1. **Immediate development** - Start working on your project right away
2. **Running initial setup** - Quickly run setup commands in the new project
3. **Exploration** - Easily browse through the template's file structure
4. **Verification** - Confirm that everything was properly cloned

## Platform-Specific Behavior

The shell behavior varies slightly depending on your operating system:

- **macOS/Linux**: Opens your default shell as specified in the `SHELL` environment variable
- **Windows**: Opens Command Prompt (`cmd.exe`)

## Example Workflow

A typical workflow using the interactive shell might look like:

```bash
# Clone a template and open a shell
gitit github:vuejs/vue-next-webpack-preview my-vue-app --shell

# In the new shell, you can immediately start working
npm install
npm run dev
```

This streamlines the process of creating a new project from a template and getting it up and running.
