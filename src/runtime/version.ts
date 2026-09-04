/**
 * Package version and build id, baked in by tsup's `define` (see
 * tsup.config.ts). Read inside a function, not as a module-level constant -
 * vitest doesn't run that build step, so tests exercise the typeof-guarded
 * fallback by setting these as real globals per test (see ui.test.ts); a
 * constant would freeze at module-import time and never see that.
 */
export function getVersion(): string {
    return typeof __VC_VERSION__ !== 'undefined' ? __VC_VERSION__ : 'dev';
}

export function getBuildId(): string {
    return typeof __VC_BUILD_ID__ !== 'undefined' ? __VC_BUILD_ID__ : 'local';
}
