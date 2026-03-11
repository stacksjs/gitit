import { dts } from 'bun-plugin-dtsx'

async function build(): Promise<void> {
  await Bun.build({
    entrypoints: ['src/index.ts', 'bin/cli.ts'],
    outdir: './dist',
    plugins: [dts()],
    target: 'node',
  })
}

build()
