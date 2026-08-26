import { ArrowUpRight } from 'lucide-react';

const snippet = `import { installVirtualConsole } from '@codehacks/virtual-console';
import '@codehacks/virtual-console/styles.css';

installVirtualConsole();`;

export default function InstallSnippet() {
    return (
        <section className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Drop it in</h2>
            <p className="mt-2 text-center text-neutral-400">
                Two lines. No provider, no context, no framework lock-in.
            </p>

            <pre className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-6 font-mono text-sm leading-relaxed text-neutral-300">
                <code>{snippet}</code>
            </pre>

            <p className="mt-4 text-center text-sm text-neutral-500">
                Or use the Vite plugin to inject it before your app bundle even runs —{' '}
                <a
                    href="https://github.com/codehacks-io/virtual-console#readme"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                >
                    full setup in the README
                    <ArrowUpRight className="size-3.5" />
                </a>
            </p>
        </section>
    );
}
