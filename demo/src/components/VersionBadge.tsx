import demoPkg from '../../package.json';

// Set by release-web.yml's "Build demo" step to the commit this deploy was
// built from; unset for local dev, where there's no meaningful build to
// point at.
const buildSha = import.meta.env.VITE_DEMO_BUILD_SHA;

// Fixed, not in the document flow: bug-report screenshots must always show
// this without the reporter having to scroll to the bottom first.
export default function VersionBadge() {
    const siteVersion = demoPkg.version;

    return (
        <p className="fixed bottom-2 right-2 z-30 font-mono text-[11px] text-neutral-700">
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
    );
}
