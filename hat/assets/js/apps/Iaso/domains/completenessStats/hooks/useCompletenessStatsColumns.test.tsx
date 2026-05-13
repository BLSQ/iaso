import React from 'react';
import { renderHook, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCompletenessStatsColumns } from './useCompletenessStatsColumns';

// 1. --- MOCKING DEPENDENCIES ---

// Hoist the permission mock so we can easily toggle it between tests
const { mockUserHasPermission } = vi.hoisted(() => ({
    mockUserHasPermission: vi.fn().mockReturnValue(true),
}));

vi.mock('../../users/utils', () => ({
    userHasOneOfPermissions: mockUserHasPermission,
}));

vi.mock('../../../utils/usersUtils', () => ({
    useCurrentUser: () => ({ id: 1, username: 'test_user' }),
}));

vi.mock('../utils', () => ({
    useGetParentPageUrl: () => vi.fn().mockReturnValue('/dummy-parent-url'),
}));

// Mock bluesquare-components to simplify the IconButtonComponent and Intl
vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: any) => msg.id || msg.defaultMessage,
        }),
        // Replace IconButtonComponent with a simple anchor tag for easy querying
        IconButton: ({ icon, overrideIcon, tooltipMessage, url }: any) => {
            const iconName =
                icon || (overrideIcon ? 'override-icon' : 'unknown');
            return (
                <a
                    href={url}
                    data-testid={`icon-btn-${iconName}`}
                    title={tooltipMessage?.id}
                >
                    {iconName}
                </a>
            );
        },
    };
});

// 2. --- MOCK DATA FOR SCENARIOS ---

// Scenario A: OrgUnit with NO submissions itself, but 50 submissions spread across children/grandchildren
const rowDescendantsHaveSubmissions = {
    original: {
        id: 1,
        org_unit: { id: 100, name: 'National Level' },
        is_root: true,
        has_children: true,
        form_stats: {
            form_a: { itself_has_instances: 0, descendants_ok: 50 },
            form_b: { itself_has_instances: 0, descendants_ok: 0 },
        },
    },
};

// Scenario B: OrgUnit with submissions itself, but no children/grandchildren submissions
const rowItselfHasSubmissions = {
    original: {
        id: 2,
        org_unit: { id: 101, name: 'Local Clinic' },
        is_root: false,
        has_children: false,
        form_stats: {
            form_a: { itself_has_instances: 5, descendants_ok: 0 },
        },
    },
};

// Scenario C: Dead zone - no submissions anywhere in the hierarchy
const rowNoSubmissionsAnywhere = {
    original: {
        id: 3,
        org_unit: { id: 102, name: 'Empty Region' },
        is_root: false,
        has_children: true,
        form_stats: {
            form_a: { itself_has_instances: 0, descendants_ok: 0 },
            form_b: { itself_has_instances: 0, descendants_ok: 0 },
        },
    },
};

// 3. --- THE TEST SUITE ---

describe('useCompletenessStatsColumns', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to having permissions
        mockUserHasPermission.mockReturnValue(true);
    });

    // Helper function to render a cell in the test DOM
    const renderActionCell = (rowSettings: any) => {
        const { result } = renderHook(() =>
            useCompletenessStatsColumns(
                { accountId: '1' } as any,
                { forms: [] } as any,
            ),
        );

        // Find the specific column configuration for 'actions'
        const actionsColumn = result.current.find(col => col.id === 'actions');

        // Render the UI that the Cell function returns
        render(
            <MemoryRouter>
                {actionsColumn?.Cell({ row: rowSettings } as any)}
            </MemoryRouter>,
        );
    };

    it('displays the eye short-cut icon when ONLY descendants (children/grandchildren) have submissions', () => {
        renderActionCell(rowDescendantsHaveSubmissions);

        // The eye icon should be present because descendants_ok is 50
        const eyeIcon = screen.getByTestId('icon-btn-remove-red-eye');
        expect(eyeIcon).toBeInTheDocument();
        expect(eyeIcon).toHaveAttribute(
            'href',
            '/forms/submissions/list/accountId/1/page/1/levels/100/isSearchActive/true',
        );
    });

    it('displays the eye short-cut icon when ONLY the org unit itself has submissions', () => {
        renderActionCell(rowItselfHasSubmissions);

        // The eye icon should be present because itself_has_instances is 5
        expect(
            screen.getByTestId('icon-btn-remove-red-eye'),
        ).toBeInTheDocument();
    });

    it('DOES NOT display the eye short-cut icon when there are zero submissions in the entire hierarchy', () => {
        renderActionCell(rowNoSubmissionsAnywhere);

        // Neither itself nor descendants have submissions
        expect(
            screen.queryByTestId('icon-btn-remove-red-eye'),
        ).not.toBeInTheDocument();
    });

    it('DOES NOT display the eye short-cut icon if the user lacks SUBMISSIONS permissions, even if submissions exist', () => {
        // Strip the user of their permissions
        mockUserHasPermission.mockReturnValue(false);

        renderActionCell(rowDescendantsHaveSubmissions);

        expect(
            screen.queryByTestId('icon-btn-remove-red-eye'),
        ).not.toBeInTheDocument();
    });
});
