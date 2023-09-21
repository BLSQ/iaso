import { formatPattern, Router } from 'react-router';

/* Modify the parameters for the current page and return the new url */
const genUrl = (
    router: Router,
    newParams: Record<string, string | number | null | undefined>,
): string =>
    formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
