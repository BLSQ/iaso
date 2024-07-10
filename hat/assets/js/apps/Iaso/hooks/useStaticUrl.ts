export const useStaticUrl = (): string =>
    window.IASO_VERSION === 'dev' ? '' : window.STATIC_URL || '';
