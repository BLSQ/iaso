import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { currentUserFactory } from '../../../__tests__/factories/users';
import { SUBMISSION_VALIDATION_WORKFLOW } from '../utils/featureFlags';
import { useCurrentUser } from '../utils/usersUtils';
import { useMenuItems } from './menu';

vi.mock('../utils/usersUtils', () => ({
    useCurrentUser: vi.fn(),
}));

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
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

const mockUseCurrentUser = vi.mocked(useCurrentUser);

const createMockUser = (featureFlags: string[] = []) => {
    return currentUserFactory.build({
        is_staff: true,
        is_superuser: true,
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
};
const renderUseMenuItems = () => renderHook(() => useMenuItems());

const getValidationWorkflowEntry = (menuItems: any[]) =>
    menuItems.find(item => item.key === 'validation-workflows');

describe('useMenuItems - SUBMISSION_VALIDATION_WORKFLOW', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds the validation workflow entry to the menu when the feature flag is enabled', () => {
        mockUseCurrentUser.mockReturnValue(
            createMockUser([SUBMISSION_VALIDATION_WORKFLOW]),
        );

        const { result } = renderUseMenuItems();

        const submissionsEntry = getValidationWorkflowEntry(result.current);

        expect(submissionsEntry).toMatchObject({
            label: 'Validation workflows',
            key: 'validation-workflows',
        });
    });

    it('does not add the validation workflow entry to the menu when the feature flag is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser([]));

        const { result } = renderUseMenuItems();

        expect(getValidationWorkflowEntry(result.current)).toBeUndefined();
    });
});
