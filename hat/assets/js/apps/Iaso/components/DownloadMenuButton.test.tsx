import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../tests/helpers';
import { DownloadMenuButton, DownloadOption } from './DownloadMenuButton';
import { openSnackBar } from './snackBars/EventDispatcher';

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any, values?: Record<string, unknown>) =>
                Object.entries(values ?? {}).reduce(
                    (text, [key, value]) =>
                        text.replace(`{${key}}`, String(value)),
                    msg?.defaultMessage ?? 'msg',
                ),
        }),
    };
});

vi.mock('./snackBars/EventDispatcher', () => ({ openSnackBar: vi.fn() }));

// data-test attributes (not data-testid)
const get = (dataTest: string): HTMLElement => {
    const element = document.querySelector<HTMLElement>(
        `[data-test="${dataTest}"]`,
    );
    if (!element) throw new Error(`${dataTest} not found`);
    return element;
};

const options: DownloadOption[] = [
    { key: 'csv', label: 'CSV', url: '/api/instances/?form_ids=1&csv=true' },
    {
        key: 'parquet_simplified_geom',
        extension: 'parquet',
        label: 'Parquet (with simplified geometry)',
        url: '/api/orgunits/?parquet=true&extra_fields=simplified_geom_geojson',
    },
];

const deferred = <T,>() => {
    let resolve: (value: T) => void = () => undefined;
    const promise = new Promise<T>(res => {
        resolve = res;
    });
    return { promise, resolve };
};

describe('DownloadMenuButton', () => {
    let clickedLinks: HTMLAnchorElement[];

    beforeEach(() => {
        clickedLinks = [];
        URL.createObjectURL = vi.fn(() => 'blob:export');
        URL.revokeObjectURL = vi.fn();
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
            function click(this: HTMLAnchorElement) {
                clickedLinks.push(this);
            },
        );
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('lists the formats', () => {
        renderWithThemeAndIntlProvider(
            <DownloadMenuButton options={options} />,
        );

        fireEvent.click(get('download-menu-button'));

        expect(get('download-option-csv')).toHaveTextContent('CSV');
        expect(
            get('download-option-parquet_simplified_geom'),
        ).toHaveTextContent('Parquet (with simplified geometry)');
    });

    it('is disabled when disabled=true', () => {
        renderWithThemeAndIntlProvider(
            <DownloadMenuButton options={options} disabled />,
        );

        expect(get('download-menu-button')).toBeDisabled();
    });

    it('disables the button and shows the progress during the download', async () => {
        const response = deferred<Response>();
        const fetchMock = vi.fn(() => response.promise);
        vi.stubGlobal('fetch', fetchMock);

        renderWithThemeAndIntlProvider(
            <DownloadMenuButton options={options} />,
        );

        fireEvent.click(get('download-menu-button'));
        fireEvent.click(get('download-option-parquet_simplified_geom'));

        expect(fetchMock).toHaveBeenCalledWith(
            options[1].url,
            expect.anything(),
        );
        expect(get('download-menu-button')).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent(
            'Preparing the file',
        );
        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        // no Content-Disposition: the option's extension is used
        response.resolve(
            new Response('PAR1', { headers: { 'X-File-Size': '4' } }),
        );

        await waitFor(() => expect(clickedLinks).toHaveLength(1));
        expect(clickedLinks[0].download).toBe('export.parquet');
        await waitFor(() =>
            expect(get('download-menu-button')).not.toBeDisabled(),
        );
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('shows an error and enables the button again when the export fails', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve(
                    new Response('{"error": "There is no form"}', {
                        status: 400,
                    }),
                ),
            ),
        );

        renderWithThemeAndIntlProvider(
            <DownloadMenuButton options={options} />,
        );

        fireEvent.click(get('download-menu-button'));
        fireEvent.click(get('download-option-csv'));

        await waitFor(() => expect(openSnackBar).toHaveBeenCalled());
        expect(clickedLinks).toHaveLength(0);
        await waitFor(() =>
            expect(get('download-menu-button')).not.toBeDisabled(),
        );
    });
});
