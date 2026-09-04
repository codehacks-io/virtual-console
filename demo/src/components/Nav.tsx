import { getVersion } from '@codehacks/virtual-console';
import { Package, Terminal } from 'lucide-react';
import GithubIcon from './GithubIcon';

// Set by release.yml's "Build demo" step to the commit this deploy was
// built from; unset for local dev, where there's no meaningful build to
// point at.
const buildSha = import.meta.env.VITE_DEMO_BUILD_SHA;

export default function Nav() {
    const version = getVersion();

    return (
        <header className="sticky top-0 z-40 border-b border-white/5 bg-neutral-950/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2 font-semibold tracking-tight">
                    <Terminal className="size-5 text-cyan-400" strokeWidth={2.25} />
                    Virtual Console
                    <a
                        href={`https://github.com/codehacks-io/virtual-console/releases/tag/v${version}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 px-2 py-0.5 text-xs font-medium text-neutral-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
                    >
                        v{version}
                    </a>
                </div>
                <div className="flex items-center gap-5 text-sm text-neutral-400">
                    <a
                        href="https://www.npmjs.com/package/@codehacks/virtual-console"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="npm"
                        className="flex items-center gap-1.5 transition hover:text-neutral-100"
                    >
                        <Package className="size-4" />
                        <span className="hidden sm:inline" aria-hidden="true">npm</span>
                    </a>
                    <a
                        href="https://github.com/codehacks-io/virtual-console"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="GitHub"
                        className="flex items-center gap-1.5 transition hover:text-neutral-100"
                    >
                        <GithubIcon className="size-4" />
                        <span className="hidden sm:inline" aria-hidden="true">GitHub</span>
                    </a>
                    {/* Dim on purpose - a debugging aid for us, not something a
                        visitor needs to notice. Lives in the sticky header (not
                        the footer) so it survives into a screenshot regardless
                        of scroll position, same reasoning as the version badge. */}
                    {buildSha ? (
                        <a
                            href={`https://github.com/codehacks-io/virtual-console/commit/${buildSha}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Demo built from commit ${buildSha}`}
                            className="hidden font-mono text-[11px] text-neutral-700 transition hover:text-neutral-500 sm:inline"
                        >
                            {buildSha.slice(0, 7)}
                        </a>
                    ) : (
                        <span
                            title="Local, unpublished build"
                            className="hidden font-mono text-[11px] text-neutral-700 sm:inline"
                        >
                            local
                        </span>
                    )}
                </div>
            </div>
        </header>
    );
}
