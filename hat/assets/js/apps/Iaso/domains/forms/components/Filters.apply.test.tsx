import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { baseUrl } from '../config';
import { Filters } from './Filters';

const mockRedirectTo = vi.fn();

vi.mock('bluesquare-components', async importOriginal => {
    const actual =
        await importOriginal<typeof import('bluesquare-components')>();
    return {
        ...actual,
        useRedirectTo: () => mockRedirectTo,
        FiltersPanel: ({
            onApply,
            values,
        }: {
            onApply: (next: Record<string, unknown>) => void;
            values: Record<string, unknown>;
        }) => (
            <button
                type="button"
                onClick={() =>
                    onApply({
                        ...values,
                        search: 'reset-page',
                    })
                }
            >
                Apply filters
            </button>
        ),
    };
});

vi.mock('Iaso/utils/usersUtils', () => ({
    useCurrentUser: () => ({ id: 1 }),
}));

vi.mock('../../users/utils', () => ({
    userHasPermission: () => false,
}));

vi.mock(
    '../../orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions',
    () => ({
        useGetOrgUnitTypesDropdownOptions: () => ({
            data: [],
            isFetching: false,
        }),
    }),
);

vi.mock('../../projects/hooks/requests', () => ({
    useGetProjectsDropdownOptions: () => ({
        data: [],
        isFetching: false,
    }),
}));

vi.mock('Iaso/api/plannings', () => ({
    useApiMicroplanningPlanningsDropdownList: () => ({ data: [] }),
}));

vi.mock('Iaso/components/DisplayIfUserHasPerm', () => ({
    DisplayIfUserHasPerm: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}));

describe('Filters apply', () => {
    beforeEach(() => {
        mockRedirectTo.mockClear();
    });

    it('resets page to 1 when applying filters', async () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <Filters
                    params={{
                        pageSize: '10',
                        order: '-updated_at',
                        page: '3',
                        orgUnitId: '1',
                        search: 'hello',
                    }}
                />
            </MemoryRouter>,
        );

        await userEvent.click(
            screen.getByRole('button', { name: 'Apply filters' }),
        );

        await waitFor(() => {
            expect(mockRedirectTo).toHaveBeenCalledWith(
                baseUrl,
                expect.objectContaining({
                    page: '1',
                    search: 'reset-page',
                }),
            );
        });
    });
});
