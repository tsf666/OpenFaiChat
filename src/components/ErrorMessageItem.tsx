import type { ErrorMessage } from '@/types'
import IconRefresh from './icons/Refresh'

interface Props {
  data: ErrorMessage
  onRetry?: () => void
}

export default ({ data, onRetry }: Props) => {
  return (
    <div class="my-4 px-4 py-3 border border-red/50 bg-red/10 relative group transition-colors hover:bg-red/15">
      
      <div class="flex justify-between items-center mb-2">
        <div class="flex items-center gap-2 text-red font-bold">
          <span class="text-lg">⚠️</span>
          <span>Error</span>
          {data.code && <span class="text-xs op-60 font-mono">({data.code})</span>}
        </div>
      </div>

      <div class="relative">
        <pre
          class="text-red op-80 text-sm font-mono p-2 bg-black/5 rounded 
                   overflow-auto max-h-60 scrollbar-thin 
                   whitespace-pre-wrap break-all">
          {(data.message || '')
            .split('},').join('},\n')
            .split(' [').join('\n\n [')
            .split('",').join('",\n ')
          }
        </pre>
      </div>

      {onRetry && (
        <div class="flex justify-end mt-3">
          <div
            onClick={onRetry}
            class="flex items-center gap-1 px-3 py-1 border border-red/50 text-red text-sm rounded-md cursor-pointer hover:bg-red/20 active:scale-95 transition-all"
          >
            <IconRefresh />
            <span class="font-medium">Regenerate</span>
          </div>
        </div>
      )}

    </div>
    
  )
}

