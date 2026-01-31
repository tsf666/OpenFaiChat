export default function disableBlocks() {
  return {
    name: 'vercel-disable-blocks',
    enforce: 'pre' as const,
    transform(code: string, id: string) {

      if (id.replace(/\\/g, '/').includes('src/pages/api/generate.ts')) {
        return {
          code: code.replace(/#vercel-disable-blocks[\s\S]+?#vercel-end/gm, ''),
          map: null,
        }
      }
    },
  }
}