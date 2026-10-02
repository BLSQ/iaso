import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiAccountsMeRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import {
    MODULE_EMBEDDED_LINKS,
    VALIDATION_WORKFLOW_MODULE,
} from 'Iaso/utils/modules';
import { currentUserFactory } from '../../../__tests__/factories/users';
import { CurrentUser, useCurrentUser } from '../utils/usersUtils';
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

const { mockCurrentAccount } = vi.hoisted(() => {
    return { mockCurrentAccount: vi.fn() };
});

vi.mock('Iaso/domains/accounts/hooks', () => ({
    useCurrentAccount: mockCurrentAccount,
}));

vi.mock('../domains/entities/hooks/requests', () => ({
    useGetEntityTypesDropdown: () => ({ data: [] }),
}));

vi.mock('../domains/home/hooks/useGetOrgunitsExtraPath', () => ({
    useGetOrgunitsExtraPath: () => undefined,
}));

const mockUseCurrentUser = vi.mocked(useCurrentUser);

const createMockUser = (): CurrentUser => {
    return currentUserFactory.build({
        is_staff: true,
        is_superuser: true,
    }) as CurrentUser;
};
const renderUseMenuItems = () => renderHook(() => useMenuItems());

const getValidationWorkflowEntry = (menuItems: any[]) =>
    menuItems.find(item => item.key === 'validation-workflows');

describe('useMenuItems - VALIDATION_WORKFLOW_MODULE', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('adds the validation workflow entry to the menu when the module is enabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser());
        mockCurrentAccount.mockReturnValue(
            getApiAccountsMeRetrieveResponseMock({
                modules: [VALIDATION_WORKFLOW_MODULE],
            }),
        );

        const { result } = renderUseMenuItems();

        const submissionsEntry = getValidationWorkflowEntry(result.current);

        expect(submissionsEntry).toMatchObject({
            label: 'Validation workflows',
            key: 'validation-workflows',
        });
    });

    it('does not add the validation workflow entry to the menu when the module is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser());
        mockCurrentAccount.mockReturnValue(
            getApiAccountsMeRetrieveResponseMock({
                modules: [],
            }),
        );

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
        mockUseCurrentUser.mockReturnValue(createMockUser());
        mockCurrentAccount.mockReturnValue(
            getApiAccountsMeRetrieveResponseMock({
                modules: [MODULE_EMBEDDED_LINKS],
            }),
        );

        const { result } = renderUseMenuItems();

        expect(getEmbeddedLinksEntry(result.current)).toMatchObject({
            label: 'Embedded links',
            key: 'pages',
        });
    });

    it('does not add the embedded links entry to the menu when the module is disabled', () => {
        mockUseCurrentUser.mockReturnValue(createMockUser());
        mockCurrentAccount.mockReturnValue(
            getApiAccountsMeRetrieveResponseMock({
                modules: [],
            }),
        );

        const { result } = renderUseMenuItems();

        expect(getEmbeddedLinksEntry(result.current)).toBeUndefined();
    });
});
