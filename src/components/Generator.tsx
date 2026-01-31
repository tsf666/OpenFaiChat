import type { ChatMessage, ErrorMessage } from '@/types'
import { generateSignature } from '@/utils/auth'
import { Index, Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js'
import { useThrottleFn } from 'solidjs-use'
import ErrorMessageItem from './ErrorMessageItem'
import IconClear from './icons/Clear'
import Picture from './icons/Picture'
import IconX from './icons/X'
import MessageItem from './MessageItem'

export default () => {
  let inputRef: HTMLTextAreaElement
  const [messageList, setMessageList] = createSignal<ChatMessage[]>([])
  const [currentError, setCurrentError] = createSignal<ErrorMessage>()
  const [currentAssistantMessage, setCurrentAssistantMessage] = createSignal('')
  const [loading, setLoading] = createSignal(false)
  const [controller, setController] = createSignal<AbortController | null>(null)
  const [isStick, setStick] = createSignal(false)
  const [showComingSoon, setShowComingSoon] = createSignal(false)
  const maxHistoryMessages = parseInt(import.meta.env.PUBLIC_MAX_HISTORY_MESSAGES || '99')


  createEffect(() => (isStick() && smoothToBottom()))

  onMount(() => {
    let lastPostion = window.scrollY
    window.addEventListener('scroll', () => {
      const nowPostion = window.scrollY
      nowPostion < lastPostion && setStick(false)
      lastPostion = nowPostion
    })

    try {
      if (localStorage.getItem('messageList'))
        setMessageList(JSON.parse(localStorage.getItem('messageList')!))
      if (localStorage.getItem('stickToBottom') === 'stick')
        setStick(true)
    } catch (err) {
      console.error(err)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    onCleanup(() => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    })
  })

  const handleBeforeUnload = () => {
    localStorage.setItem('messageList', JSON.stringify(messageList()))
    isStick() ? localStorage.setItem('stickToBottom', 'stick') : localStorage.removeItem('stickToBottom')
  }

  const handleButtonClick = async () => {
    const inputValue = inputRef.value
    if (!inputValue) return

    inputRef.value = ''
    inputRef.style.height = 'auto'
    setMessageList([
      ...messageList(),
      { role: 'user', content: inputValue },
    ])
    requestWithLatestMessage()
    instantToBottom()
  }

  const smoothToBottom = useThrottleFn(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 300)

  const instantToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' })
  }


  const convertReqMsgList = (originalMsgList: any[]) => {
    return originalMsgList.filter((curMsg, i, arr) => {
      const nextMsg = arr[i + 1]
      return !nextMsg || curMsg.role !== nextMsg.role
    })
  }

  const requestWithLatestMessage = async () => {
    setLoading(true)
    setCurrentAssistantMessage('')
    setCurrentError(undefined)
    const storagePassword = localStorage.getItem('pass')

    try {
      const abortController = new AbortController()
      setController(abortController)

      const requestMessageList = messageList().map(message => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })).slice(-maxHistoryMessages)

      const timestamp = Date.now()
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: JSON.stringify({
          messages: convertReqMsgList(requestMessageList),
          time: timestamp,
          pass: storagePassword,
          sign: await generateSignature({
            t: timestamp,
            m: requestMessageList?.[requestMessageList.length - 1]?.parts[0]?.text || '',
          }),
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const error = await response.json()
        setCurrentError(error.error)
        throw new Error('Request failed')
      }

      const data = response.body
      if (!data) throw new Error('No data')

      const reader = data.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        if (value) {
          const char = decoder.decode(value, { stream: true })
          if (!(char === '\n' && currentAssistantMessage().endsWith('\n'))) {
            setCurrentAssistantMessage(currentAssistantMessage() + char)
          }
          isStick() && instantToBottom()
        }
        done = readerDone
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') console.error(e)
      setLoading(false)
      setController(null)
      return
    }
    archiveCurrentMessage()
  }

  const archiveCurrentMessage = () => {
    if (currentAssistantMessage()) {
      setMessageList([
        ...messageList(),
        { role: 'assistant', content: currentAssistantMessage() },
      ])
      setCurrentAssistantMessage('')
      setLoading(false)
      setController(null)
      if (!('ontouchstart' in document.documentElement || navigator.maxTouchPoints > 0))
        inputRef.focus()
    }
  }

  const clear = () => {
    inputRef.value = ''
    inputRef.style.height = 'auto'
    setMessageList([])
    setCurrentAssistantMessage('')
    setCurrentError(undefined)
  }

  const stopStreamFetch = () => {
    if (controller()) {
      controller()?.abort()
      archiveCurrentMessage()
    }
  }

  const retryLastFetch = () => {
    if (messageList().length > 0) {
      const lastMessage = messageList()[messageList().length - 1]
      if (lastMessage.role === 'assistant')
        setMessageList(messageList().slice(0, -1))
      requestWithLatestMessage()
    }
  }

  const handleCopyAll = () => {
    const content = messageList().map((msg) => {
      const roleName = msg.role === 'user' ? 'User' : 'Assistant'
      return `### ${roleName}:\n${msg.content}`
    }).join('\n\n---\n\n')
    
    if (navigator.clipboard && content) {
      navigator.clipboard.writeText(content)
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.isComposing || e.shiftKey) return
    if (e.key === 'Enter') {
      e.preventDefault()
      handleButtonClick()
    }
  }

  return (
    <div class="my-6">
      <Show when={showComingSoon()}>
        <div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-[90%] max-w-md">
          <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 border border-slate-200 dark:border-slate-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-900 dark:text-white">Coming soon</h3>
              <button onClick={() => setShowComingSoon(false)} class="text-slate-400 hover:text-slate-600">
                <IconX />
              </button>
            </div>
            <p class="text-slate-500 dark:text-slate-400 mt-2">Chat with picture is coming soon!项目重构重点</p>
          </div>
        </div>
      </Show>

      <Index each={messageList()}>
        {(message, index) => (
          <MessageItem
            role={message().role}
            message={message().content}
            showRetry={() => (message().role === 'assistant' && index === messageList().length - 1)}
            onRetry={retryLastFetch}
            onCopyAll={handleCopyAll}
          />
        )}
      </Index>

      {currentAssistantMessage() && (
        <MessageItem role="assistant" message={currentAssistantMessage()} />
      )}

      {currentError() && <ErrorMessageItem data={currentError()!} onRetry={retryLastFetch} />}

      <Show
        when={!loading()}
        fallback={() => (
          <div class="h-12 my-4 flex items-center justify-center gap-4 bg-slate-500/15 rounded-sm">
            <span class="text-sm">Gemini is thinking...</span>
            <div
              class="px-2 py-0.5 border border-slate-500/30 rounded-md text-sm opacity-70 cursor-pointer hover:bg-slate-500/10"
              onClick={stopStreamFetch}
            >
              Stop Now
            </div>
          </div>
        )}
      >
        <div class="my-4 flex gap-2 relative transition-opacity">
          <button
            title="Picture"
            onClick={() => setShowComingSoon(true)}
            class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
          >
            <Picture />
          </button>
          <textarea
            ref={inputRef!}
            onKeyDown={handleKeydown}
            placeholder="Enter something..."
            autocomplete="off"
            autofocus
            onInput={() => {
              inputRef.style.height = 'auto'
              inputRef.style.height = `${inputRef.scrollHeight}px`
            }}
            rows={1}
            class="w-full px-10 py-3 min-h-[3rem] max-h-36 rounded-sm bg-slate-500/15 resize-none focus:ring-0 focus:outline-none placeholder:opacity-50"
          />
          <button
            onClick={handleButtonClick}
            class="h-12 px-4 py-2 bg-slate-500/15 hover:bg-slate-500/20 rounded-sm transition-colors"
          >
            Send
          </button>
          <button
            title="Clear"
            onClick={clear}
            class="h-12 px-4 py-2 bg-slate-500/15 hover:bg-slate-500/20 rounded-sm transition-colors text-xl"
          >
            <IconClear />
          </button>
        </div>
      </Show>
    </div>
  )
}