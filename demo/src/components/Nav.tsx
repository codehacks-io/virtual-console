import { Package, Terminal } from 'lucide-react';
import GithubIcon from './GithubIcon';

export default function Nav() {
    return (
        <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 font-semibold tracking-tight">
                    <Terminal className="size-5 text-cyan-400" strokeWidth={2.25} />
                    Virtual Console
                </div>
                <div className="flex items-center gap-5 text-sm text-neutral-400">
                    <a
                        href="https://www.npmjs.com/package/@codehacks/virtual-console"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 transition hover:text-neutral-100"
                    >
                        <Package className="size-4" />
                        <span className="hidden sm:inline">npm</span>
                    </a>
                    <a
                        href="https://github.com/codehacks-io/virtual-console"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 transition hover:text-neutral-100"
                    >
                        <GithubIcon className="size-4" />
                        <span className="hidden sm:inline">GitHub</span>
                    </a>
                </div>
            </div>
        </header>
    );
}
