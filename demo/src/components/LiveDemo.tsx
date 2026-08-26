import { AlertTriangle, Bug, FileJson, Terminal, Zap } from 'lucide-react';

const actions = [
    {
        label: 'Log an object',
        icon: FileJson,
        run: () =>
            console.log('User session', {
                id: 'usr_8f2a1',
                roles: ['admin', 'beta'],
                lastSeen: new Date().toISOString()
            })
    },
    {
        label: 'Warn',
        icon: AlertTriangle,
        run: () => console.warn('Cache is stale — refetching in the background')
    },
    {
        label: 'Error',
        icon: Bug,
        run: () => console.error('Failed to fetch /api/profile: 503 Service Unavailable')
    },
    {
        label: 'Throw an error',
        icon: Zap,
        run: () => {
            throw new Error('Something broke on purpose — this is what an uncaught error looks like');
        }
    }
];

export default function LiveDemo() {
    return (
        <section id="try-it" className="mx-auto max-w-4xl px-6 py-16">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.02] px-5 py-3">
                    <Terminal className="size-4 shrink-0 text-cyan-400" />
                    <span className="whitespace-nowrap text-sm font-medium text-neutral-200">Try it live</span>
                    <span className="ml-auto hidden truncate text-xs text-neutral-500 sm:inline">
                        open the console, then click a button
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                    {actions.map(({ label, icon: Icon, run }) => (
                        <button
                            key={label}
                            onClick={run}
                            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-5 text-sm text-neutral-300 transition hover:border-cyan-400/30 hover:bg-white/[0.05] hover:text-neutral-100"
                        >
                            <Icon className="size-5 text-neutral-500 transition group-hover:text-cyan-400" />
                            {label}
                        </button>
                    ))}
                </div>

                <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs text-neutral-500">
                    Or type straight into the REPL at the bottom of the console — try{' '}
                    <code className="rounded bg-white/5 px-1 py-0.5 font-mono text-neutral-300">
                        {'{a: 1, b: [1, 2, 3]}'}
                    </code>
                </div>
            </div>
        </section>
    );
}
