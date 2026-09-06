import { EyeOff, Palette, ShieldCheck, SquareStack, SquareTerminal, Smartphone } from 'lucide-react';

const features = [
    {
        icon: ShieldCheck,
        title: 'Survives a crash',
        body: "Injects before your app's own bundle runs, so it's still there even if React never mounts."
    },
    {
        icon: Smartphone,
        title: 'Mobile-friendly',
        body: 'Two-finger long-press to open on a phone or tablet — no keyboard required.'
    },
    {
        icon: SquareStack,
        title: 'Object inspector',
        body: 'Expandable viewer for objects, arrays, Maps, and Sets — click to drill in, just like DevTools.'
    },
    {
        icon: SquareTerminal,
        title: 'Live REPL',
        body: 'A real eval-backed console with syntax highlighting, history, and inline autocomplete.'
    },
    {
        icon: Palette,
        title: 'Five themes',
        body: 'VS Code, Chrome Light, Dracula, Nord, and Tokyo Night — or bring your own.'
    },
    {
        icon: EyeOff,
        title: 'Zero telemetry',
        body: "Fully local. Nothing you log — or that the console logs about itself — leaves the page."
    }
];

export default function Features() {
    return (
        <section className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {features.map(({ icon: Icon, title, body }) => (
                    <div
                        key={title}
                        className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20 hover:bg-white/[0.04]"
                    >
                        <Icon className="size-5 text-cyan-400" />
                        <h3 className="mt-4 font-medium text-neutral-100">{title}</h3>
                        <p className="mt-1.5 text-sm text-neutral-400">{body}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
