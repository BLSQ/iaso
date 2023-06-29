import { formatPattern } from 'react-router';

const genUrl = (router, newParams) =>
    formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
