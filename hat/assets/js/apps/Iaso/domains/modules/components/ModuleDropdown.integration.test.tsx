import React from 'react';
import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import moment from 'moment';

import { setupServer } from 'msw/node';
import { vi } from 'vitest';
import {
    getApiModulesDropdownListMockHandler,
    getApiModulesDropdownListResponseMock,
} from 'Iaso/api/modules/endpoints/modules/modules.msw';
import { useCurrentUserHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import {
    renderWithThemeAndIntlProvider,
    TestingQueryClient,
} from '../../../../../tests/helpers';
import { ModulesDropdown } from './ModulesDropdown';

const mockFn = vi.fn();

const handlers = [
    getApiModulesDropdownListMockHandler(async info => {
        mockFn(info);

        return getApiModulesDropdownListResponseMock();
    }),
];
const previousDefaults = TestingQueryClient.getDefaultOptions();

const server = setupServer(...handlers);
vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('Iaso/domains/users/utils', () => ({
    useCurrentUserHasOneOfPermissions: vi.fn(),
}));
describe('Module dropdown integration test', () => {
    beforeAll(() => {
        TestingQueryClient.setDefaultOptions({
            queries: {
                retry: false,
            },
        });
        faker.seed(1);
        server.listen({
            onUnhandledRequest: 'error',
        });
        vi.mocked(useCurrentUser).mockReturnValue({} as any);
        vi.mocked(useCurrentUserHasOneOfPermissions).mockReturnValue(true);
    });

    afterEach(() => {
        server.resetHandlers();
        TestingQueryClient.clear();
    });

    afterAll(() => {
        faker.seed(Date.now());
        server.close();
        TestingQueryClient.setDefaultOptions(previousDefaults);
        vi.clearAllMocks();
    });
    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
    });

    it('refetches when locale changes', async () => {
        moment.locale('en');

        const { rerender } = renderWithThemeAndIntlProvider(
            <ModulesDropdown keyValue={'modules'} />,
        );

        await waitFor(() => {
            expect(screen.queryByRole('progressbar')).toBeNull();
        });

        await waitFor(() => {
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
        moment.locale('fr');

        rerender(<ModulesDropdown keyValue={'modules'} />);

        await waitFor(() => {
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });
});
