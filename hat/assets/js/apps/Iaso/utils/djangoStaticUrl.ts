/**
 * URLs for files under Django `STATIC_URL` (collectstatic / CDN).
 * Do not use for Vite `import` assets — those already resolve to a full URL.
 */
export const djangoStaticUrl = (relativePath: string): string => {
    if (/^https?:\/\//i.test(relativePath)) {
        return relativePath;
    }
    const base = window.STATIC_URL ?? '/static/';
    const path = relativePath.replace(/^\//, '');
    return `${base}${path}`;
};