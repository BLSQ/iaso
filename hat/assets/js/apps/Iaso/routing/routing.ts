import { formatPattern, Router } from 'react-router';

/* Modify the url for the current page and return the new url */
const genUrl = (router: Router, newParams: Record<string, string>): string =>
    formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
