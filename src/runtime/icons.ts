/**
 * Icon sprite: every icon is defined once as an SVG <symbol> and referenced
 * elsewhere via <use>, so N log entries share one set of path data instead
 * of repeating markup (or depending on an external icon file).
 */

const ICON_SPRITE_ID = 'virtual-console-icon-sprite';

const ICON_SPRITE_MARKUP = `<defs>
    <symbol id="vc-icon-prompt" viewBox="0 0 16 16">
        <path d="M5 3.5 10 8 5 12.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>
    <symbol id="vc-icon-result" viewBox="0 0 16 16">
        <path d="M10 3.5 5 8 10 12.5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="13" cy="8" r="1.15" fill="currentColor"/>
    </symbol>
    <symbol id="vc-icon-error" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 5v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="11.25" r="0.9" fill="currentColor"/>
    </symbol>
    <symbol id="vc-icon-warning" viewBox="0 0 16 16">
        <path d="M8 2 14.5 13.5 1.5 13.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M8 6.5v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="8" cy="11" r="0.85" fill="currentColor"/>
    </symbol>
</defs>`;

export type IconName = 'prompt' | 'result' | 'error' | 'warning';

/**
 * Inserts the icon sprite into `root` if it isn't already there. Safe to
 * call every time createConsole() runs - a destroyed console removes its
 * whole container (sprite included), so there's nothing to weed out on
 * re-install.
 */
export function ensureIconSprite(root: HTMLElement): void {
    if (root.querySelector(`#${ICON_SPRITE_ID}`)) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = ICON_SPRITE_ID;
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.width = '0';
    svg.style.height = '0';
    svg.style.overflow = 'hidden';
    svg.innerHTML = ICON_SPRITE_MARKUP;

    root.prepend(svg);
}

/** Creates a small <svg><use></svg> referencing one of the sprite's icons. */
export function createIcon(name: IconName, className?: string): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className ? `vc-icon ${className}` : 'vc-icon');
    svg.setAttribute('aria-hidden', 'true');

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#vc-icon-${name}`);
    svg.appendChild(use);

    return svg;
}
