import demoPkg from '../../package.json';

// Set by release-web.yml's "Build demo" step to the commit this deploy was
// built from; unset for local dev, where there's no meaningful build to
// point at.
const buildSha = import.meta.env.VITE_DEMO_BUILD_SHA;

export default function Footer() {
    const siteVersion = demoPkg.version;

    return (
        <footer className="border-t border-white/5 px-6 py-10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 sm:flex-row">
                <p>MIT © codehacks</p>
                <div className="flex gap-5">
                    <a href="https://github.com/codehacks-io/virtual-console" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        GitHub
                    </a>
                    <a href="https://www.npmjs.com/package/@codehacks/virtual-console" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        npm
                    </a>
                    <a href="https://github.com/codehacks-io/virtual-console/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-neutral-300">
                        License
                    </a>
                </div>
            </div>
            {/* This site's own version (from demo/package.json, tagged web-v{version}
                by vump) plus the commit it was built from - a debugging aid for us,
                not something a visitor needs, so it's dim and tucked below the main
                footer row rather than in the nav. */}
            <p className="mx-auto mt-6 max-w-6xl text-center font-mono text-[11px] text-neutral-700">
                <a
                    href={`https://github.com/codehacks-io/virtual-console/releases/tag/web-v${siteVersion}`}
                    target="_blank"
                    rel="noreferrer"
                    title={`Demo site v${siteVersion}`}
                    className="transition hover:text-neutral-500"
                >
                    v{siteVersion}
                </a>
                {buildSha ? (
                    <a
                        href={`https://github.com/codehacks-io/virtual-console/commit/${buildSha}`}
                        target="_blank"
                        rel="noreferrer"
                        title={`Built from commit ${buildSha}`}
                        className="transition hover:text-neutral-500"
                    >
                        -{buildSha.slice(0, 7)}
                    </a>
                ) : (
                    <span title="Local, unpublished build">-local</span>
                )}
            </p>
        </footer>
    );
}
