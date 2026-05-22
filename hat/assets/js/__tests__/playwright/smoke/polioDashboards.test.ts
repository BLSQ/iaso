import { test as base, expect } from '@playwright/test';
import type { Page } from 'playwright-core';

const SAVE_SCREENSHOTS = process.env?.SAVE_SMOKE_TEST_SCREENSHOT ?? false;
const MONITOR_CONSOLE_ERRORS =
    process.env?.SMOKE_TEST_MONITOR_CONSOLE_ERRORS ?? false;

const expectNoErrors = async ({ page }: { page: Page }) => {
    await expect(
        page.locator('.error-container, .notistack-MuiContent-error'),
    ).toHaveCount(0);
    await expect(page.getByText('An exception occurred')).toHaveCount(0);
};

const openDashboard = async ({
    page,
    url,
    title,
}: {
    page: Page;
    url: string;
    title: string;
}) => {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('progressbar')).toHaveCount(0);
    await expect(page).toHaveTitle(title);

    await expectNoErrors({ page });
};

type Fixtures = {
    errors: string[];
};

const test = base.extend<Fixtures>({
    errors: [
        async (
            { page }: { page: Page },
            use: (value: string[]) => Promise<void>,
        ) => {
            if (!MONITOR_CONSOLE_ERRORS) {
                await use([]);
                return;
            }
            const errors: string[] = [];

            page.on('console', msg => {
                if (msg.type() === 'error') {
                    errors.push(msg.text());
                }
            });

            page.on('pageerror', error => {
                errors.push(error.message);
            });

            await use(errors);

            if (errors.length > 0) {
                throw new Error('Console/page errors:\n' + errors.join('\n'));
            }
        },
        { auto: true },
    ],
});

test.describe('polio dashboards', () => {
    test.afterEach(async ({ page }, testInfo) => {
        if (SAVE_SCREENSHOTS) {
            await page.screenshot({
                path: testInfo.outputPath(`screenshot.png`),
                fullPage: true,
            });
        }
    });

    test('dashboard "calendar" is working', async ({ page }) => {
        await openDashboard({
            page,
            url: 'https://staging.poliooutbreaks.com/dashboard/polio/embeddedCalendar/campaignType/polio/',
            title: 'DEMO GPEI',
        });

        // check the tiles are rendered
        await expect(page.locator('.leaflet-container')).toBeVisible();
        await expect(page.locator('.leaflet-tile').first()).toBeVisible();
        await expect(
            page.locator('.leaflet-tile-loaded').first(),
        ).toBeVisible();
    });

    test('dashboard "vaccine repository" is working', async ({ page }) => {
        await openDashboard({
            page,
            url: 'https://staging.poliooutbreaks.com/dashboard/polio/embeddedVaccineRepository/',
            title: 'DEMO GPEI',
        });

        // check that table is rendered with columns
        expect(page.getByRole('table')).toBeVisible();

        const columns = [
            'Country',
            'OBR Name',
            'Round number(s)',
            'Vaccine',
            'Start date',
            'VRF',
            'Pre Alert',
            'Form A',
        ];

        columns.forEach(column => {
            expect(
                page.getByRole('columnheader', { name: column }),
            ).toBeVisible();
        });
    });

    test('dashboard "vaccine stock" is working', async ({ page }) => {
        await openDashboard({
            page,
            url: 'https://staging.poliooutbreaks.com/dashboard/polio/embeddedVaccineStock/',
            title: 'DEMO GPEI',
        });

        // check some data
        await expect(page.getByText('COUNTRY STOCK CARDS')).toBeVisible();

        const columns = [
            'Country',
            'Vaccine',
            'Date',
            'Vials type',
            'Action type',
            'Action',
            'Vials IN',
            'Vials OUT',
            'Doses IN',
            'Doses OUT',
        ];

        columns.forEach(column => {
            expect(
                page.getByRole('columnheader', { name: column, exact: true }),
            ).toBeVisible();
        });
    });

    test('dashboard "LQAS country" is working', async ({ page }) => {
        await openDashboard({
            page,
            url: 'https://staging.poliooutbreaks.com/dashboard/polio/embeddedLqasCountry/',
            title: 'DEMO GPEI | LQAS',
        });

        // check the tiles are rendered and data
        await expect(
            page.getByRole('heading', { name: 'LQAS', exact: true }),
        ).toBeVisible();
        expect(await page.locator('.leaflet-container').count()).toBe(2);
        expect(await page.locator('.leaflet-container').first()).toBeVisible();
        expect(await page.locator('.leaflet-container').last()).toBeVisible();

        await expect(page.locator('.leaflet-tile').first()).toBeVisible();
        await expect(
            page.locator('.leaflet-tile-loaded').first(),
        ).toBeVisible();
    });

    test('dashboard "LQAS continent" is working', async ({ page }) => {
        await openDashboard({
            page,
            url: 'https://staging.poliooutbreaks.com/dashboard/polio/embeddedLqasMap/',
            title: 'DEMO GPEI | LQAS map',
        });

        // check data
        await expect(
            page.getByRole('heading', { name: 'LQAS map', exact: true }),
        ).toBeVisible();
        expect(await page.locator('.leaflet-container').count()).toBe(2);
        await expect(page.locator('.leaflet-container').first()).toBeVisible();
        await expect(page.locator('.leaflet-container').last()).toBeVisible();
    });
});
