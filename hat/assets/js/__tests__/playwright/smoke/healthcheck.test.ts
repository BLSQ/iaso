import { test, expect } from '@playwright/test';

const ENV = {
    prod: 'https://iaso.bluesquare.org',
    pathways: 'https://collect.projectpathways.org/',
    playground: 'https://iaso-playground.bluesquare.org',
    campaigns: 'https://www.poliooutbreaks.com/',
    'iaso-demo': 'https://demo.openiaso.com',
};

let envToCheck = process.env?.HEALTH_ENV
    ? process.env?.HEALTH_ENV?.split(',')
    : ['all'];

if (envToCheck.some(env => env === 'all')) {
    envToCheck = Object.keys(ENV);
}

envToCheck
    .filter(env => env in ENV)
    .map(env => {
        test(`health endpoints are working and right tags have been deployed on ${ENV?.[env]}`, async ({
            request,
        }) => {
            const response = await request.get(
                new URL('health', ENV?.[env]).toString(),
            );

            const tag = process.env.GIT_TAG;

            expect(response.ok()).toBeTruthy();

            const responseJson = await response.json();

            expect(responseJson?.up).toBe('ok');
            expect(responseJson?.VERSION).toBe(tag);
        });
    });
