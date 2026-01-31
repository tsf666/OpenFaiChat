import type { ChatMessage } from '@/types'
import MarkdownIt from 'markdown-it'
import mdHighlight from 'markdown-it-highlightjs'
import mdKatex from 'markdown-it-katex'
import type { Accessor } from 'solid-js'
import { createSignal } from 'solid-js'
import { useClipboard, useEventListener } from 'solidjs-use'
import IconRefresh from './icons/Refresh'
import IconCopy from './icons/Copy'

interface Props {
  role: ChatMessage['role']
  message: Accessor<string> | string
  showRetry?: Accessor<boolean>
  onRetry?: () => void
  onCopyAll?: () => void 
}

export default ({ role, message, showRetry, onRetry, onCopyAll }: Props) => {
  const roleClass = {
    system: 'bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300',
    user: 'bg-gradient-to-r from-purple-400 to-yellow-400',
    assistant: 'bg-gradient-to-r from-yellow-200 via-green-200 to-green-300',
  }


  const rawMessage = () => typeof message === 'function' ? message() : message

  const [source] = createSignal('')
  const { copy, copied } = useClipboard({ source, copiedDuring: 1000 })

  const [copiedAll, setCopiedAll] = createSignal(false)

  const handleCopyAll = () => {
    if (onCopyAll) {
      onCopyAll()
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 1000)
    }
  }


  useEventListener('click', (e) => {
    const el = e.target as HTMLElement
    let code = null

    if (el.matches('div > div.copy-btn')) {
      code = decodeURIComponent(el.dataset.code!)
      copy(code)
    }
    if (el.matches('div > div.copy-btn > svg')) {
      code = decodeURIComponent(el.parentElement?.dataset.code!)
      copy(code)
    }
  })

  const htmlString = () => {
    const md = MarkdownIt({
      linkify: true,
      breaks: true,
    }).use(mdKatex).use(mdHighlight)

    const fence = md.renderer.rules.fence!
    md.renderer.rules.fence = (...args) => {
      const [tokens, idx] = args
      const token = tokens[idx]
      const rawCode = fence(...args)

  
      return `<div class="relative group">
      <div data-code=${encodeURIComponent(token.content)} 
           class="copy-btn absolute top-3 right-3 z-10 flex items-center justify-center border border-transparent w-8 h-8 p-2 bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-90 cursor-pointer transition-opacity rounded">
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 32 32"><path fill="currentColor" d="M28 10v18H10V10h18m0-2H10a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z" /><path fill="currentColor" d="M4 18H2V4a2 2 0 0 1 2-2h14v2H4Z" /></svg>
          <div class="absolute -top-8 whitespace-nowrap px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
            ${copied() ? '已复制' : '复制'}
          </div>
      </div>
      ${rawCode}
      </div>`
    }

 
    const content = rawMessage()  
    return content ? md.render(content) : ''

  }

 

  return (
    <div class="py-2 -mx-4 px-4 transition-colors hover:bg-slate-500/5">
      <div class="flex gap-3 rounded-lg" classList={{ 'opacity-75': role === 'user' }}>
        
        <div class={`shrink-0 w-7 h-7 mt-4 rounded-full opacity-80 ${roleClass[role] || roleClass.system}`} />
      
        <div class="message prose prose-slate dark:prose-invert max-w-full break-words overflow-hidden" innerHTML={htmlString()} />
      </div>


      <div class="flex items-center justify-between mt-2 px-3 mb-2">

        <div
          onClick={() => copy(rawMessage())}
          class="flex items-center gap-1 px-2 py-0.5 opacity-70 border border-slate-500/30 rounded-md text-sm cursor-pointer hover:bg-slate-500/10 transition-colors relative group"
          classList={{ 
            'bg-white/50 dark:bg-white/20 opacity-100 scale-[0.98]': copied(),
            'opacity-70 hover:bg-slate-500/10': !copied() 
          }}
          title="Copy as Markdown Format"
        >
          <IconCopy />
          <span>{copied() ? 'Copied ~' : 'Copy'}</span>
        </div>

        {showRetry?.() && onCopyAll && (
          <div
            onClick={handleCopyAll}
            class="flex items-center gap-1 px-2 py-0.5 border border-slate-500/30 rounded-md text-sm cursor-pointer transition-all duration-200"
            classList={{ 
              'bg-white/50 dark:bg-white/20 opacity-100 scale-[0.98]': copiedAll(),
              'opacity-70 hover:bg-slate-500/10': !copiedAll() 
            }}
          >
            <IconCopy />
            <span>{copiedAll() ? 'Entire conversation has been copied' : 'Copy entire conversation'}</span>
          </div>
        )}

        {showRetry?.() && onRetry && (
          <div
            onClick={onRetry}
            class="flex items-center gap-1 px-2 py-0.5 opacity-70 border border-slate-500/30 rounded-md text-sm cursor-pointer hover:bg-slate-500/10 transition-colors"
          >
            <IconRefresh />
            <span>Regenerate</span>
          </div>
        )}

      </div>
    </div>
  )
}