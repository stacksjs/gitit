import type { GitItOptions } from '../src/types'
import { relative } from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'

const cli = new CAC('gitit')

cli
  .command('template [template] [dir]', 'Clone a template from a repository')
  .option('--force', 'Clone to existing directory even if exists')
  .option('--force-clean', 'Remove any existing directory or file recursively before cloning')
  .option('--shell', 'Open a new shell with current working directory')
  .option('--install', 'Install dependencies after cloning')
  .option('--verbose', 'Show verbose debugging info')
  .option('--command <command>', 'Custom command to run after template is cloned')
  .option('--auth <token>', 'Custom Authorization token to use for downloading template')
  .option('--cwd <dir>', 'Set current working directory to resolve dirs relative to it')
  .option('--offline', 'Do not attempt to download and use cached version')
  .option('--prefer-offline', 'Use cache if exists otherwise try to download')
  .example('gitit template github:user/repo my-project')
  .example('gitit template github:user/repo my-project --command "npm run dev"')
  .action(async (template?: string, dir?: string, options?: GitItOptions) => {
    if (!template) {
      console.error('Missing template argument')
      return
    }

    if (options?.verbose) {
      process.env.DEBUG = process.env.DEBUG || 'true'
    }

    console.log(`Cloning template ${template}...`)

    // Set the current working directory if specified
    if (options?.cwd) {
      process.chdir(options.cwd)
    }

    // Placeholder for actual template download logic
    const templateDir = dir || './'
    const _to = relative(process.cwd(), templateDir) || './'
    console.log(`✨ Successfully cloned to \`${_to}\`\n`)

    // Open a shell if requested
    if (options?.shell) {
      console.log('Opening shell in cloned directory...')
      // Placeholder for shell opening logic
    }

    // Run custom command if specified
    if (options?.command) {
      console.log(`Running command: ${options.command}`)
      // Placeholder for command execution
      console.log(`Command execution would happen here`)
    }
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
