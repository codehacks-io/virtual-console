/// <reference types="vite/client" />

interface ImportMetaEnv {
    /**
     * Short commit SHA this site was built and deployed from - set by
     * release-website.yml's "Build website" step. Unset for local dev.
     */
    readonly VITE_WEBSITE_BUILD_SHA?: string;
}
