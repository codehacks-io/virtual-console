import { getVersion } from '@codehacks/virtual-console';

// Set by release.yml's "Build demo" step to the commit this deploy was
// built from; unset for local dev, where there's no meaningful build to
// point at.
const buildSha = import.meta.env.VITE_DEMO_BUILD_SHA;

export default function Footer() {
    const version = getVersion();

    return (
        <footer className="border-t border-white/5 px-6 py-10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 sm:flex-row">
                <p className="flex items-center gap-2">
                    <span>MIT © codehacks</span>
                    <span aria-hidden="true">·</span>
                    <a
                        href={`https://github.com/codehacks-io/virtual-console/releases/tag/v${version}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-neutral-300"
                    >
                        v{version}
                    </a>
                </p>
                <div className="flex items-center gap-5">
                    <a href="https://github.com/codehacks-io/virtual-console" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        GitHub
                    </a>
                    <a href="https://www.npmjs.com/package/@codehacks/virtual-console" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        npm
                    </a>
                    <a href="https://github.com/codehacks-io/virtual-console/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        License
                    </a>
                    {buildSha ? (
                        <a
                            href={`https://github.com/codehacks-io/virtual-console/commit/${buildSha}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`Demo built from commit ${buildSha}`}
                            className="font-mono text-xs text-neutral-700 hover:text-neutral-400"
                        >
                            {buildSha.slice(0, 7)}
                        </a>
                    ) : (
                        <span title="Local, unpublished build" className="font-mono text-xs text-neutral-700">
                            local
                        </span>
                    )}
                </div>
            </div>
        </footer>
    );
}
