// Rasterises the source SVGs in public/ into the PNG variants needed for the
// PWA manifest, the Apple touch icon, and the Open Graph share image. Run with
// `npm run assets` whenever icon.svg or og-image.svg changes; the generated
// PNGs are committed so the build/CI never need to rasterise.
import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pub = resolve(root, 'public')

const render = async (svgFile, outFile, width) => {
  const svg = await readFile(resolve(pub, svgFile), 'utf8')
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    font: { loadSystemFonts: true },
  })
  const png = resvg.render().asPng()
  await writeFile(resolve(pub, outFile), png)
  console.log(`✓ ${outFile} (${width}px)`)
}

await render('icon.svg', 'icon-192.png', 192)
await render('icon.svg', 'icon-512.png', 512)
await render('icon.svg', 'apple-touch-icon.png', 180)
await render('og-image.svg', 'og-image.png', 1200)
