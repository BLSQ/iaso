import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { currentUserFactory } from '../../../__tests__/factories/users';
import { SUBMISSION_VALIDATION_WORKFLOW } from '../utils/featureFlags';
import * as paths from './routes';
import { useMenuItems } from './menu';

vi.mock('../utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual = await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) =>
                msg?.defaultMessage ?? msg?.id ?? 'msg',
        }),
    };
});

vi.mock('../domains/entities/hooks/requests', () => ({
    useGetEntityTypesDropdown: () => ({ data: [] }),
}));

vi.mock('../domains/home/hooks/useGetOrgunitsExtraPath', () => ({
    useGetOrgunitsExtraPath: () => undefined,
}));

import { useCurrentUser } from '../utils/usersUtils';

const mockUseCurrentUser = vi.mocked(useCurrentUser);

const createMockUser = (featureFlags: string[] = []) => ({
    ...currentUserFactory.build(),
    is_staff: false,
    permissions: paths.instancesValidationPath.permissions,
    account: {
        feature_flags: featureFlags,
        modules: [],
        default_version: {
            data_source: {
                url: null,
            },
        },
    },
});
const renderUseMenuItems = () => renderHook(() => useMenuItems());

const getValidationSubmissionsEntry = (menuItems: any[]) =>
    menuItems
        .find(item => item.key === 'validation')
        ?.subMenu?.find(entry => entry.key === 'submissions');

describe('useMenuItems - SUBMISSION_VALIDATION_WORKFLOW', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds the submissions entry to the validation menu when the feature flag is enabled', () => {
        mockUseCurrentUser.mockReturnValue(
            createMockUser([SUBMISSION_VALIDATION_WORKFLOW]),
        );

        const { result } = renderUseMenuItems();

        const submissionsEntry = getValidationSubmissionsEntry(result.current);

        expect(submissionsEntry).toMatchObject({
            label: 'Submissions',
            key: 'submissions',
            permissions: paths.instancesValidationPath.permissions,
        });
    });

    it('does not add the submissions entry when the feature flag is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser([]));

        const { result } = renderUseMenuItems();

        expect(getValidationSubmissionsEntry(result.current)).toBeUndefined();
    });

    it('does not duplicate the submissions entry across rerenders', () => {
        mockUseCurrentUser.mockReturnValue(
            createMockUser([SUBMISSION_VALIDATION_WORKFLOW]),
        );

        const { result, rerender } = renderUseMenuItems();
        rerender();

        const validationMenu = result.current.find(
            item => item.key === 'validation',
        );
        const submissionsEntries =
            validationMenu?.subMenu?.filter(
                entry => entry.key === 'submissions',
            ) ?? [];

        expect(submissionsEntries).toHaveLength(1);
    });
});
