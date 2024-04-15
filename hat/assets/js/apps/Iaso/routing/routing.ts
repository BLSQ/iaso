import { formatPattern } from 'react-router';

// FIXME: delete - depredcated in react-router6
/* Modify the parameters for the current page and return the new url */
const genUrl = (
    router: Router,
    newParams: Record<string, string | number | null | undefined>,
): string =>
    // formatPattern(router.routes[0].path, { ...router.params, ...newParams });
    '/home';

export { genUrl };
