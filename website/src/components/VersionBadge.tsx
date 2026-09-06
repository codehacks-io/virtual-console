import { useState } from 'react';
import websitePkg from '../../package.json';

// Set by release-website.yml's "Build website" step to the commit this deploy was
// built from; unset for local dev, where there's no meaningful build to
// point at.
const buildSha = import.meta.env.VITE_WEBSITE_BUILD_SHA;

// Fixed, not in the document flow: bug-report screenshots must always show
// this without the reporter having to scroll to the bottom first.
export default function VersionBadge() {
    const siteVersion = websitePkg.version;
    const label = buildSha ? `v${siteVersion}-${buildSha.slice(0, 7)}` : `v${siteVersion}-local`;
    const [copied, setCopied] = useState(false);

    const handleClick = async () => {
        try {
            await navigator.clipboard.writeText(label);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard access can be denied (e.g. insecure context); nothing to fall back to.
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            title={buildSha ? `Built from commit ${buildSha}` : 'Local, unpublished build'}
            className="fixed bottom-2 right-2 z-30 font-mono text-[10px] text-neutral-700/40 transition hover:text-neutral-500"
        >
            {copied ? 'copied!' : label}
        </button>
    );
}
