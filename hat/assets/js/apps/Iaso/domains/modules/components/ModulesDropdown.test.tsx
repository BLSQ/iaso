import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('Iaso/domains/users/utils', () => ({
    useCurrentUserHasOneOfPermissions: vi.fn(),
}));

vi.mock('Iaso/api/modules', () => ({
    getApiModulesDropdownListQueryKey: vi.fn(),
    useApiModulesDropdownList: vi.fn(),
}));

import {
    getApiModulesDropdownListQueryKey,
    useApiModulesDropdownList,
} from 'Iaso/api/modules';
import { useCurrentUserHasOneOfPermissions } from 'Iaso/domains/users/utils';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ModulesDropdown } from './ModulesDropdown';

describe('ModulesDropdown', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useCurrentUserHasOneOfPermissions).mockReturnValue(true);

        vi.mocked(getApiModulesDropdownListQueryKey).mockReturnValue([
            // @ts-ignore
            'modules',
        ]);

        vi.mocked(useApiModulesDropdownList).mockReturnValue({
            data: [],
            isLoading: false,
        } as any);
    });

    it('renders nothing when user does not have permission', () => {
        vi.mocked(useCurrentUserHasOneOfPermissions).mockReturnValue(false);

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
