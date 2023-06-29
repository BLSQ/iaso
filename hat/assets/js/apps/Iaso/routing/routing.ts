import { formatPattern } from 'react-router';
import { RouteConfig } from 'react-router-config';

interface Router {
  routes: RouteConfig[];
  params: Record<string, string>;
}

const genUrl = (router: Router, newParams: Record<string, string>): string =>
  formatPattern(router.routes[0].path, { ...router.params, ...newParams });

export { genUrl };
