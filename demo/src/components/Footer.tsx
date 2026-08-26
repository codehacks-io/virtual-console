export default function Footer() {
    return (
        <footer className="border-t border-white/5 px-6 py-10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-neutral-500 sm:flex-row">
                <p>MIT © codehacks-io</p>
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
        </footer>
    );
}
