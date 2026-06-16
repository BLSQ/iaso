import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    MODULE_EMBEDDED_LINKS,
    VALIDATION_WORKFLOW_MODULE,
} from 'Iaso/utils/modules';
import { currentUserFactory } from '../../../__tests__/factories/users';
import { useCurrentUser, User } from '../utils/usersUtils';
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

const createMockUser = (modules: string[] = []): User => {
    return currentUserFactory.build({
        is_staff: true,
        is_superuser: true,
        account: {
            feature_flags: [],
            modules: modules,
            default_version: {
                data_source: {
                    url: null,
                },
            },
        },
    }) as User;
};
const renderUseMenuItems = () => renderHook(() => useMenuItems());

const getValidationWorkflowEntry = (menuItems: any[]) =>
    menuItems.find(item => item.key === 'validation-workflows');

describe('useMenuItems - VALIDATION_WORKFLOW_MODULE', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds the validation workflow entry to the menu when the module is enabled', () => {
        mockUseCurrentUser.mockReturnValue(
            createMockUser([VALIDATION_WORKFLOW_MODULE]),
        );

        const { result } = renderUseMenuItems();

        const submissionsEntry = getValidationWorkflowEntry(result.current);

        expect(submissionsEntry).toMatchObject({
            label: 'Validation workflows',
            key: 'validation-workflows',
        });
    });

    it('does not add the validation workflow entry to the menu when the module is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser([]));

        const { result } = renderUseMenuItems();

        expect(getValidationWorkflowEntry(result.current)).toBeUndefined();
    });
});

const getEmbeddedLinksEntry = (menuItems: any[]) =>
    menuItems.find(item => item.key === 'pages');

describe('useMenuItems - MODULE_EMBEDDED_LINKS', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds the embedded links entry to the menu when the module is enabled', () => {
        mockUseCurrentUser.mockReturnValue(
            createMockUser([MODULE_EMBEDDED_LINKS]),
        );

        const { result } = renderUseMenuItems();

        expect(getEmbeddedLinksEntry(result.current)).toMatchObject({
            label: 'Embedded links',
            key: 'pages',
        });
    });

    it('does not add the embedded links entry to the menu when the module is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser([]));

        const { result } = renderUseMenuItems();

        expect(getEmbeddedLinksEntry(result.current)).toBeUndefined();
    });
});
