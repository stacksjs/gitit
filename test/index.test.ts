import { beforeAll, describe, expect, it } from 'bun:test'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'pathe'
import { downloadTemplate } from '../src'

describe('downloadTemplate', () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, '.tmp'), { recursive: true, force: true })
  })

  it('clone unjs/template', async () => {
    const destinationDirectory = resolve(__dirname, '.tmp/cloned')
    const { dir } = await downloadTemplate('gh:unjs/template', {
      dir: destinationDirectory,
      preferOffline: true,
    })
    expect(await existsSync(resolve(dir, 'package.json')))
  })

  it('do not clone to exisiting dir', async () => {
    const destinationDirectory = resolve(__dirname, '.tmp/exisiting')
    await mkdir(destinationDirectory).catch(() => { })
    await writeFile(resolve(destinationDirectory, 'test.txt'), 'test')
    await expect(
      downloadTemplate('gh:unjs/template', { dir: destinationDirectory }),
    ).rejects.toThrow('already exists')
  })
})
