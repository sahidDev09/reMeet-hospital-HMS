import Link from 'next/link'
import { Wordmark } from '@/components/brand/logo'

interface AuthSplitWrapperProps {
  children: React.ReactNode
  mode?: 'sign-in' | 'sign-up'
}

export function AuthSplitWrapper({ children, mode = 'sign-in' }: AuthSplitWrapperProps) {
  const isSignIn = mode === 'sign-in'

  return (
    <div className="relative min-h-screen lg:h-dvh lg:max-h-dvh w-full overflow-x-hidden lg:overflow-hidden bg-white font-sans">
      <div className="grid min-h-screen lg:h-full w-full lg:grid-cols-12">
        {/* Left Column: Visual & Hero Branding with Abstract Geometric Art */}
        <div className="relative hidden h-full flex-col justify-between overflow-hidden bg-[#f7faff] px-8 pt-8 sm:px-12 sm:pt-10 lg:col-span-6 lg:flex xl:col-span-6 xl:px-16">
          {/* Top: reMeet Brand Wordmark */}
          <div className="relative z-10 flex items-center justify-start shrink-0">
            <Link
              href="/"
              className="group inline-flex items-center transition-transform hover:opacity-90"
            >
              <Wordmark className="text-2xl" />
            </Link>
          </div>

          {/* Center-Top: High-impact Hero Copy */}
          <div className="relative z-10 mt-6 max-w-xl shrink-0">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-[#112953] sm:text-5xl lg:text-[3rem] xl:text-[3.35rem] lg:leading-[1.12]">
              {isSignIn ? (
                <>
                  The Next <br />
                  Generation <br />
                  <span className="text-[#0284c7]">Of Clinic &amp; Family Care</span>
                </>
              ) : (
                <>
                  Join the <br />
                  reMeet Care <br />
                  <span className="text-[#0284c7]">Healthcare Network</span>
                </>
              )}
            </h1>
            <p className="mt-4 max-w-lg text-sm sm:text-base lg:text-[1.0625rem] leading-relaxed text-slate-500">
              {isSignIn
                ? 'Access your clinical workspace, patient records, prescriptions, and appointment schedules all in one unified medical platform.'
                : 'Create your hospital account to connect with trusted medical specialists, book consults, and access clinical wellness services.'}
            </p>
          </div>

          {/* Bottom Area: Full-Width Gapless Abstract Geometric Composition */}
          <div className="relative mt-auto h-[44vh] sm:h-[48vh] lg:h-[52vh] w-[calc(100%+4rem)] sm:w-[calc(100%+6rem)] xl:w-[calc(100%+8rem)] -mx-8 sm:-mx-12 xl:-mx-16 overflow-hidden shrink-0">
            {/* Full-width continuous bottom background band / base glow */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cyan-500/20 via-teal-500/10 to-transparent" />

            {/* Left Geometric Cluster (Teal & Cyan) */}
            <div className="pointer-events-none absolute -bottom-16 -left-8 size-72 sm:size-80 lg:size-96 rounded-t-full bg-teal-500" />
            <div className="pointer-events-none absolute -bottom-6 left-20 size-48 sm:size-56 rounded-full bg-cyan-400 opacity-95" />
            <div className="pointer-events-none absolute bottom-28 -left-4 size-32 rounded-tr-full bg-teal-600" />
            <div className="pointer-events-none absolute bottom-16 left-56 size-24 rounded-full bg-cyan-300" />

            {/* Center Overlapping Bridge Shapes (Ensures NO GAPS across the bottom) */}
            <div className="pointer-events-none absolute -bottom-10 left-[28%] size-56 sm:size-64 rounded-t-full bg-blue-500/90" />
            <div className="pointer-events-none absolute -bottom-4 left-[42%] size-44 sm:size-52 rounded-full bg-cyan-500" />
            <div className="pointer-events-none absolute bottom-8 left-[36%] size-28 rounded-full bg-teal-400" />

            {/* Right Geometric Cluster (Royal Blue, Amber & Purple) */}
            <div className="pointer-events-none absolute -bottom-16 -right-8 size-72 sm:size-80 lg:size-96 rounded-tl-full bg-purple-500" />
            <div className="pointer-events-none absolute -bottom-10 right-28 size-52 sm:size-60 rounded-full bg-amber-400" />
            <div className="pointer-events-none absolute bottom-12 right-12 size-36 sm:size-44 rounded-full bg-blue-600" />
            <div className="pointer-events-none absolute -bottom-12 right-72 size-44 rounded-t-full bg-purple-600/90" />
            <div className="pointer-events-none absolute bottom-28 right-48 size-20 rounded-full bg-amber-300" />
          </div>
        </div>

        {/* Right Column: Authentication Form with Generous Left Spacing & Centered Alignment */}
        <div className="relative flex h-full flex-col justify-between overflow-y-auto bg-white px-8 py-8 sm:px-14 lg:col-span-6 lg:pl-28 lg:pr-16 xl:pl-36 xl:pr-24 2xl:pl-44 2xl:pr-32">
          {/* Mobile Top Brand Bar */}
          <div className="flex items-center justify-between pb-4 shrink-0 lg:hidden">
            <Link href="/" className="inline-flex items-center">
              <Wordmark className="text-xl" />
            </Link>
          </div>

          {/* Form Container: Centered with generous breathing room */}
          <div className="my-auto flex w-full flex-col items-center justify-center py-4">
            <div className="w-full max-w-[420px]">
              {children}
            </div>
          </div>

          {/* Bottom Security / Logging Note */}
          <div className="pt-4 pb-2 text-center text-xs text-slate-400 shrink-0">
            reMeet Clinical System &bull; Protected &amp; Verified Access
          </div>
        </div>
      </div>
    </div>
  )
}



