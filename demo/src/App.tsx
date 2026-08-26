import Features from './components/Features';
import Footer from './components/Footer';
import Hero from './components/Hero';
import InstallSnippet from './components/InstallSnippet';
import LiveDemo from './components/LiveDemo';
import Nav from './components/Nav';

export default function App() {
    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            <Nav />
            <main>
                <Hero />
                <LiveDemo />
                <Features />
                <InstallSnippet />
            </main>
            <Footer />
        </div>
    );
}
