/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Short commit SHA this demo was built and deployed from - set by
     * release.yml's "Build demo" step. Unset for local dev.
     */
    readonly VITE_DEMO_BUILD_SHA?: string;
}
