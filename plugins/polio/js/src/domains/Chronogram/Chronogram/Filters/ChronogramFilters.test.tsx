import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../../../../hat/assets/js/tests/helpers';

import { baseUrls } from '../../../../constants/urls';
import { useGetCountries } from '../../../../hooks/useGetCountries';
import { useOptionChronogram } from '../../api/useOptionChronogram';
import MESSAGES from '../messages';
import { ChronogramFilters } from './ChronogramFilters';

const mockHandleChange = vi.fn();
const mockHandleSearch = vi.fn();

const mockUseFilterState = vi.fn();

vi.mock(
    '../../../../../../../../hat/assets/js/apps/Iaso/hooks/useFilterState',
    () => ({
        useFilterState: (...args: unknown[]) => mockUseFilterState(...args),
    }),
);

vi.mock('../../api/useOptionChronogram', () => ({
    useOptionChronogram: vi.fn(),
}));

vi.mock('../../../../hooks/useGetCountries', () => ({
    useGetCountries: vi.fn(),
}));

vi.mock(
    '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm',
    () => ({
        DisplayIfUserHasPerm: ({ children }: { children: React.ReactNode }) => (
            <>{children}</>
        ),
    }),
);

vi.mock('../Modals/CreateChronogramModal', () => ({
    CreateChronogramModal: () => (
        <button type="button" data-testid="create-chronogram-modal">
            Create chronogram
        </button>
    ),
}));

const mockUseOptionChronogram = vi.mocked(useOptionChronogram);
const mockUseGetCountries = vi.mocked(useGetCountries);

const defaultFilters = {
    search: '',
    country: '',
    campaign: '',
    on_time: '',
    campaign_category: '',
};

const renderFilters = (params = {}) =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <ChronogramFilters params={params} />
        </MemoryRouter>,
    );

describe('ChronogramFilters', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFilterState.mockReturnValue({
            filters: defaultFilters,
            handleSearch: mockHandleSearch,
            handleChange: mockHandleChange,
            filtersUpdated: false,
            changeAndSearch: vi.fn(),
            setFiltersUpdated: vi.fn(),
            setFilters: vi.fn(),
        });
        mockUseOptionChronogram.mockReturnValue({
            data: {
                campaigns: [{ label: 'Campaign A', value: 'camp-a' }],
            },
            isFetching: false,
        } as ReturnType<typeof useOptionChronogram>);
        mockUseGetCountries.mockReturnValue({
            data: {
                orgUnits: [
                    { id: 1, name: 'Country One' },
                    { id: 2, name: 'Country Two' },
                ],
            },
            isFetching: false,
        } as ReturnType<typeof useGetCountries>);
    });

    it('renders all filter fields', async () => {
        renderFilters();

        await waitFor(() => {
            expect(screen.getByLabelText('search')).toBeInTheDocument();
            expect(
                screen.getByRole('combobox', {
                    name: MESSAGES.filterLabelCountry.defaultMessage,
                }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('combobox', {
                    name: MESSAGES.filterLabelCampaign.defaultMessage,
                }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('combobox', {
                    name: MESSAGES.filterLabelOnTime.defaultMessage,
                }),
            ).toBeInTheDocument();
            expect(
                screen.getByRole('combobox', {
                    name: MESSAGES.filterLabelCampaignCategory.defaultMessage,
                }),
            ).toBeInTheDocument();
        });
    });

    it('initializes filter state from route params', () => {
        renderFilters({ search: 'round 1', country: '1,2' });

        expect(mockUseFilterState).toHaveBeenCalledWith(
            expect.objectContaining({
                params: { search: 'round 1', country: '1,2' },
            }),
        );
    });

    it('disables the search button when filters are unchanged', () => {
        renderFilters();

        expect(screen.getByTestId('search-button')).toBeDisabled();
    });

    it('enables the search button and triggers search when filters changed', async () => {
        const user = userEvent.setup();
        mockUseFilterState.mockReturnValue({
            filters: { ...defaultFilters, search: 'delayed' },
            handleSearch: mockHandleSearch,
            handleChange: mockHandleChange,
            filtersUpdated: true,
            changeAndSearch: vi.fn(),
            setFiltersUpdated: vi.fn(),
            setFilters: vi.fn(),
        });

        renderFilters();

        const searchButton = screen.getByTestId('search-button');
        expect(searchButton).not.toBeDisabled();

        await user.click(searchButton);

        expect(mockHandleSearch).toHaveBeenCalledOnce();
    });

    it('calls handleChange when typing in the search field', async () => {
        const user = userEvent.setup();
        renderFilters();

        const searchInput = screen.getByLabelText('search');

        await user.type(searchInput, 'abc');

        expect(mockHandleChange).toHaveBeenCalled();
        expect(mockHandleChange).toHaveBeenCalledWith(
            'search',
            expect.any(String),
        );
    });

    it('renders chronogram admin actions', async () => {
        renderFilters();

        await waitFor(() => {
            expect(
                screen.getByRole('link', {
                    name: MESSAGES.linkToChronogramTemplateTask.defaultMessage,
                }),
            ).toHaveAttribute(
                'href',
                `/dashboard/${baseUrls.chronogramTemplateTask}`,
            );
            expect(
                screen.getByTestId('create-chronogram-modal'),
            ).toBeInTheDocument();
        });
    });
});
