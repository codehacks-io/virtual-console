import { toggleConsole } from '@codehacks/virtual-console';
import { MousePointerClick, Sparkles } from 'lucide-react';
import CopyCommand from './CopyCommand';

export default function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div
                className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[36rem] w-[64rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-cyan-500 opacity-20 blur-3xl"
            />

            <div className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center sm:pt-32">
                <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-300">
                    <Sparkles className="size-3.5 text-cyan-400" />
                    MIT licensed · zero telemetry · 3.8&nbsp;kB gzipped
                </div>

                <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                    A debug console that shows up{' '}
                    <span className="bg-gradient-to-r from-cyan-300 to-sky-500 bg-clip-text text-transparent">
                        even when your app doesn't
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 text-balance">
                    Virtual Console injects before your bundle even runs — so you get logs, an
                    object inspector, and a live REPL even if your app crashes before it ever
                    mounts. Mobile-friendly. Nothing phones home.
                </p>

                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <button
                        onClick={() => toggleConsole()}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-400 px-5 py-3 font-medium text-neutral-950 transition hover:bg-cyan-300 sm:w-auto"
                    >
                        <MousePointerClick className="size-4" />
                        Open the console
                    </button>
                    <CopyCommand command="npm install @codehacks/virtual-console" />
                </div>

                <p className="mt-5 text-sm text-neutral-500">
                    or press <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">Shift</kbd>
                    {' + '}
                    <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono">C</kbd>
                    , or long-press with two fingers on mobile
                </p>
            </div>
        </section>
    );
}
