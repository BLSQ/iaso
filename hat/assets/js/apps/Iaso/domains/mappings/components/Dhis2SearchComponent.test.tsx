import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import MESSAGES from '../messages';
import Dhis2Search from './Dhis2SearchComponent';

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

const DATA_SOURCE_ID = 42;
const DATA_ELEMENTS_URL = `*/api/datasources/${DATA_SOURCE_ID}/dataElements.json`;
const SOURCE_DETAILS_HREF = `/settings/source/details/sourceId/${DATA_SOURCE_ID}`;

const server = setupServer();

const respondWith = (response: () => Response) =>
    server.use(http.get(DATA_ELEMENTS_URL, response));

const searchOn = (dataSourceId: number) => (
    <MemoryRouter>
        <Dhis2Search
            dataSourceId={dataSourceId}
            resourceName="dataElements"
            label="Search data element"
            name="dataElement"
            onChange={vi.fn()}
        />
    </MemoryRouter>
);

const renderSearch = () =>
    renderWithThemeAndIntlProvider(searchOn(DATA_SOURCE_ID));

const typeInSearch = (text: string) =>
    fireEvent.change(screen.getByRole('combobox'), {
        target: { value: text },
    });

describe('Dhis2Search', () => {
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    beforeEach(() => {
        vi.mocked(useCurrentUser).mockReturnValue({
            permissions: ['iaso_sources'],
        } as any);
    });

    it('explains DHIS2 rejected the credentials and links to the data source', async () => {
        respondWith(() =>
            HttpResponse.json(
                {
                    error: 'DHIS2 credentials are not valid',
                    code: 'dhis2_invalid_credentials',
                },
                { status: 409 },
            ),
        );
        renderSearch();

        typeInSearch('malaria');

        expect(
            await screen.findByText(
                MESSAGES.dhis2InvalidCredentials.defaultMessage,
            ),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', {
                name: MESSAGES.checkDataSource.defaultMessage,
            }),
        ).toHaveAttribute('href', SOURCE_DETAILS_HREF);
    });

    it('explains no credentials are configured', async () => {
        respondWith(() =>
            HttpResponse.json(
                {
                    error: 'No credentials configured',
                    code: 'dhis2_no_credentials',
                },
                { status: 409 },
            ),
        );
        renderSearch();

        typeInSearch('malaria');

        expect(
            await screen.findByText(MESSAGES.dhis2NoCredentials.defaultMessage),
        ).toBeInTheDocument();
    });

    it('explains DHIS2 is unreachable on an unexpected error page', async () => {
        respondWith(
            () => new HttpResponse('<html>Bad gateway</html>', { status: 502 }),
        );
        renderSearch();

        typeInSearch('malaria');

        expect(
            await screen.findByText(MESSAGES.dhis2Unavailable.defaultMessage),
        ).toBeInTheDocument();
    });

    it('hides the data source link from users who cannot see data sources', async () => {
        vi.mocked(useCurrentUser).mockReturnValue({
            permissions: ['iaso_mappings'],
        } as any);
        respondWith(() =>
            HttpResponse.json(
                { error: 'DHIS2 is not available', code: 'dhis2_unavailable' },
                { status: 409 },
            ),
        );
        renderSearch();

        typeInSearch('malaria');

        expect(
            await screen.findByText(MESSAGES.dhis2Unavailable.defaultMessage),
        ).toBeInTheDocument();
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('clears the message once DHIS2 answers again', async () => {
        respondWith(() =>
            HttpResponse.json(
                { error: 'DHIS2 is not available', code: 'dhis2_unavailable' },
                { status: 409 },
            ),
        );
        renderSearch();
        typeInSearch('malaria');
        await screen.findByText(MESSAGES.dhis2Unavailable.defaultMessage);

        respondWith(() =>
            HttpResponse.json({
                dataElements: [{ id: 'deMalaria', name: 'Malaria cases' }],
            }),
        );
        typeInSearch('malaria cases');

        await waitFor(() =>
            expect(
                screen.queryByText(MESSAGES.dhis2Unavailable.defaultMessage),
            ).not.toBeInTheDocument(),
        );
    });

    it('searches the new data source and forgets the previous error when the data source changes', async () => {
        const OTHER_SOURCE_ID = 43;
        respondWith(() =>
            HttpResponse.json(
                { error: 'DHIS2 is not available', code: 'dhis2_unavailable' },
                { status: 409 },
            ),
        );
        server.use(
            http.get(
                `*/api/datasources/${OTHER_SOURCE_ID}/dataElements.json`,
                () =>
                    HttpResponse.json(
                        {
                            error: 'DHIS2 credentials are not valid',
                            code: 'dhis2_invalid_credentials',
                        },
                        { status: 409 },
                    ),
            ),
        );
        const { rerender } = renderSearch();
        typeInSearch('malaria');
        await screen.findByText(MESSAGES.dhis2Unavailable.defaultMessage);

        rerender(searchOn(OTHER_SOURCE_ID));

        expect(
            screen.queryByText(MESSAGES.dhis2Unavailable.defaultMessage),
        ).not.toBeInTheDocument();
        typeInSearch('malaria cases');
        expect(
            await screen.findByText(
                MESSAGES.dhis2InvalidCredentials.defaultMessage,
            ),
        ).toBeInTheDocument();
    });
});
