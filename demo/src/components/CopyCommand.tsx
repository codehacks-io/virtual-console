import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyCommand({ command }: { command: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            onClick={copy}
            className="group flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-neutral-200 transition hover:border-white/20 hover:bg-white/[0.07] sm:w-auto"
        >
            <span className="text-neutral-500">$</span>
            <span className="flex-1 text-left">{command}</span>
            {copied ? (
                <Check className="size-4 shrink-0 text-cyan-400" />
            ) : (
                <Copy className="size-4 shrink-0 text-neutral-500 transition group-hover:text-neutral-300" />
            )}
        </button>
    );
}
