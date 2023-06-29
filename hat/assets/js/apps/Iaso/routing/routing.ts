import { formatPattern, Router } from 'react-router';

/* Generate a new url for the current page with the modified parameters */
const genUrl = (router: Router, newParams: Record<string, string>): string =>
    formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
