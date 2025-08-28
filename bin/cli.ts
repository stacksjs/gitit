#!/usr/bin/env bun

import type { GitItOptions } from '../src/types'
import { spawn } from 'node:child_process'
import { relative } from 'node:path'
import process from 'node:process'
import { CAC } from 'cac'
import { version } from '../package.json'
import { downloadTemplate } from '../src/gitit'
import { startShell } from '../src/utils'

const cli = new CAC('gitit')

cli
  .command('[template] [dir]', 'Clone a template from a repository')
  .alias('clone [template] [dir]')
  .alias('create [template] [dir]')
  .alias('new [template] [dir]')
  .option('--template <template>', 'Template to clone')
  .option('--dir <dir>', 'Directory to clone the template into')
  .option('--force', 'Clone to existing directory even if exists')
  .option('--force-clean', 'Remove any existing directory or file recursively before cloning')
  .option('--shell', 'Open a new shell with current working directory')
  .option('--install', 'Install dependencies after cloning')
  .option('--command <command>', 'Custom command to run after template is cloned')
  .option('--auth <token>', 'Custom Authorization token to use for downloading template')
  .option('--cwd <dir>', 'Set current working directory to resolve dirs relative to it')
  .option('--offline', 'Do not attempt to download and use cached version')
  .option('--prefer-offline', 'Use cache if exists otherwise try to download')
  .option('--verbose', 'Show verbose debugging info')
  .example('gitit github:user/repo my-project')
  .example('gitit github:user/repo my-project --command "npm run dev"')
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

    try {
      // Use the actual downloadTemplate function instead of placeholder
      const result = await downloadTemplate(template, {
        dir,
        force: options?.force,
        forceClean: options?.forceClean,
        offline: options?.offline,
        preferOffline: options?.preferOffline,
        auth: options?.auth,
        install: options?.install,
      })

      const _to = relative(process.cwd(), result.dir) || './'
      console.log(`✨ Successfully cloned to \`${_to}\`\n`)

      // Open a shell if requested
      if (options?.shell) {
        startShell(result.dir)
      }

      // Run custom command if specified
      if (options?.command) {
        console.log(`Running command: ${options.command}`)

        // Execute the command
        const [cmd, ...args] = options.command.split(' ')
        const child = spawn(cmd!, args, {
          cwd: result.dir,
          stdio: 'inherit',
          shell: true,
        })

        // Wait for the command to finish
        await new Promise<void>((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              resolve()
            }
            else {
              reject(new Error(`Command exited with code ${code}`))
            }
          })
          child.on('error', reject)
        })
      }
    }
    catch (error) {
      console.error(`Error cloning template: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  })

cli.command('version', 'Show the version of the CLI').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
