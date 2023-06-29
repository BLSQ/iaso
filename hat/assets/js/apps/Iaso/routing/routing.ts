import { formatPattern, Router } from 'react-router';

const genUrl = (router: Router, newParams: Record<string, string>): string =>
    formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
