import { Wordmark } from '@/components/brand/logo'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <Wordmark className="text-xl animate-pulse" />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-line">
          <div className="h-full w-full origin-left animate-[progress_1.2s_ease-in-out_infinite] rounded-full bg-accent" />
        </div>
      </div>
    </div>
  )
}
