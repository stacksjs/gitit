import { dts } from 'bun-plugin-dtsx'

async function build(): Promise<void> {
  await Bun.build({
    minify: true,
    entrypoints: ['src/index.ts', 'bin/cli.ts'],
    outdir: './dist',
    plugins: [dts()],
    target: 'node',
  })
}

build()
