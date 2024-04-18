import { routeConfigs } from './routes';

// Keep this out of routes.js to avoid dependency cycle
export const routeConfigsNoElement = routeConfigs.map(config => {
    const { baseUrl, params } = config;
    return { baseUrl, params };
});
