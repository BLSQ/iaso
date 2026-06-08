import React from 'react';
import moment from 'moment';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('Iaso/domains/users/utils', () => ({
    userHasOneOfPermissions: vi.fn(),
}));

vi.mock('Iaso/api/modules', () => ({
    getApiModulesDropdownListQueryKey: vi.fn(),
    useApiModulesDropdownList: vi.fn(),
}));

import {
    getApiModulesDropdownListQueryKey,
    useApiModulesDropdownList,
} from 'Iaso/api/modules';
import { userHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ModulesDropdown } from './ModulesDropdown';

describe('ModulesDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useCurrentUser).mockReturnValue({} as any);
        vi.mocked(userHasOneOfPermissions).mockReturnValue(true);

        vi.mocked(getApiModulesDropdownListQueryKey).mockReturnValue([
            // @ts-ignore
            'modules',
        ]);

        vi.mocked(useApiModulesDropdownList).mockReturnValue({
            data: [],
            isLoading: false,
        } as any);
    });

    it('includes locale in query key', () => {
        moment.locale('fr');

        renderWithThemeAndIntlProvider(
            <ModulesDropdown keyValue={'modules'} />,
        );

        expect(useApiModulesDropdownList).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                query: expect.objectContaining({
                    queryKey: ['modules', 'fr'],
                }),
            }),
        );
    });

    it('changes query key when locale changes', () => {
        moment.locale('fr');

        const { rerender } = renderWithThemeAndIntlProvider(
            <ModulesDropdown keyValue={'modules'} />,
        );

        expect(useApiModulesDropdownList).toHaveBeenLastCalledWith(
            undefined,
            expect.objectContaining({
                query: expect.objectContaining({
                    queryKey: ['modules', 'fr'],
                }),
            }),
        );

        moment.locale('en');

        rerender(<ModulesDropdown keyValue={'modules'} />);

        expect(useApiModulesDropdownList).toHaveBeenLastCalledWith(
            undefined,
            expect.objectContaining({
                query: expect.objectContaining({
                    queryKey: ['modules', 'en'],
                }),
            }),
        );
    });
    it('renders nothing when user does not have permission', () => {
        vi.mocked(userHasOneOfPermissions).mockReturnValue(false);

        const { container } = renderWithThemeAndIntlProvider(
            <ModulesDropdown keyValue={'modules'} />,
        );

        expect(container.firstChild).toBeNull();

        expect(useApiModulesDropdownList).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                query: expect.objectContaining({
                    enabled: false,
                }),
            }),
        );
    });
});
