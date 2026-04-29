import React from 'react';
import { axe } from 'jest-axe';
import { describe, it, expect, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { ValidationWorkflowDropdown } from './ValidationWorkflowDropdown';

const { mockCurrentUser } = vi.hoisted(() => {
    return { mockCurrentUser: vi.fn() };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: mockCurrentUser,
}));

const { mockUserHasPermission } = vi.hoisted(() => {
    return { mockUserHasPermission: vi.fn() };
});

vi.mock('Iaso/domains/users/utils', () => ({
    userHasPermission: mockUserHasPermission,
}));

const { mockUseGetWorkflowOptions } = vi.hoisted(() => {
    return { mockUseGetWorkflowOptions: vi.fn() };
});

vi.mock('Iaso/domains/instances/validationWorkflow/api/Get', () => ({
    useGetWorkflowOptions: mockUseGetWorkflowOptions,
}));

const { mockHasFeatureFlag } = vi.hoisted(() => {
    return { mockHasFeatureFlag: vi.fn() };
});

vi.mock('Iaso/utils/featureFlags', async () => {
    const actual = await vi.importActual('Iaso/utils/featureFlags');
    return {
        ...actual,
        hasFeatureFlag: mockHasFeatureFlag,
    };
});

describe('ValidationWorkflowDropdown accessibility', () => {
    it('has no accessibility violations', async () => {
        mockCurrentUser.mockReturnValue({ id: 1 });
        mockUserHasPermission.mockReturnValue(true);
        mockHasFeatureFlag.mockReturnValue(true);

        mockUseGetWorkflowOptions.mockReturnValue({
            data: [{ label: 'A', value: 'a' }],
            isFetching: false,
        });

        const { container } = renderWithThemeAndIntlProvider(
            <ValidationWorkflowDropdown
                keyValue={'vf'}
                label={{ id: 'tempLabel', defaultMessage: 'Some label' }}
            />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
