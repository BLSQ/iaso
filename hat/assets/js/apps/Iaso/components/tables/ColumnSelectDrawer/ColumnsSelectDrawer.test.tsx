import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ColumnsSelectDrawer, Option } from './index';

vi.mock('react-intersection-observer', () => ({
    InView: ({ children }: { children: any }) =>
        children({ inView: true, ref: vi.fn() }),
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? ''),
        }),
        BlockPlaceholder: () => <div data-testid="block-placeholder" />,
    };
});

describe('ColumnsSelectDrawer', () => {
    const mockSetOptions = vi.fn();
    const mockHandleApplyOptions = vi.fn();

    const mockOptions: Option[] = [
        { key: 'col1', label: 'Column 1', active: true, disabled: false },
        { key: 'col2', label: 'Column 2', active: true, disabled: false },
        { key: 'col3', label: 'Column 3', active: false, disabled: false },
    ];

    const baseProps = {
        options: mockOptions,
        setOptions: mockSetOptions,
        minColumns: 2,
        disabled: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering & Opening Drawer', () => {
        it('should render the toggle button', () => {
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} />,
            );

            const toggleBtn = screen.getByRole('button', {
                name: /select visible columns/i,
            });
            expect(toggleBtn).toBeInTheDocument();
            expect(toggleBtn).not.toBeDisabled();
        });

        it('should open the drawer when the toggle button is clicked', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} />,
            );

            const toggleBtn = screen.getByRole('button', {
                name: /select visible columns/i,
            });
            await user.click(toggleBtn);

            expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
            expect(screen.getByText('Column 1')).toBeInTheDocument();
        });

        it('should render a disabled button with tooltip if disabled and message provided', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer
                    {...baseProps}
                    disabled={true}
                    disabledMessage="Cannot change columns right now"
                />,
            );

            const toggleBtn = screen.getByRole('button', {
                name: /select visible columns/i,
            });
            expect(toggleBtn).toBeDisabled();

            await user.hover(toggleBtn.parentElement!);
            await waitFor(() => {
                expect(
                    screen.getByText('Cannot change columns right now'),
                ).toBeInTheDocument();
            });
        });
    });

    describe('Search Filtering', () => {
        it('should filter the list of columns based on search input', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            const searchInput = screen.getByPlaceholderText(/search/i);

            await user.type(searchInput, '3');

            expect(screen.getByText('Column 3')).toBeInTheDocument();
            expect(screen.queryByText('Column 1')).not.toBeInTheDocument();
            expect(screen.queryByText('Column 2')).not.toBeInTheDocument();
        });

        it('should clear the search when the clear icon is clicked', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            const searchInput = screen.getByPlaceholderText(/search/i);
            await user.type(searchInput, '3');
            expect(screen.queryByText('Column 1')).not.toBeInTheDocument();

            const clearBtn = screen.getByRole('button', {
                name: /empty search/i,
            });
            await user.click(clearBtn);

            expect(searchInput).toHaveValue('');
            expect(screen.getByText('Column 1')).toBeInTheDocument();
        });
    });

    describe('Toggling Options & Constraints', () => {
        it('should call setOptions with updated array when a switch is clicked', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            const col3Switch = screen.getAllByRole('checkbox')[2];
            await user.click(col3Switch);

            expect(mockSetOptions).toHaveBeenCalledTimes(1);

            const newOptionsCall = mockSetOptions.mock.calls[0][0];
            expect(newOptionsCall[2].active).toBe(true);
        });

        it('should disable active switches if activeOptionsCount equals minColumns', async () => {
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer {...baseProps} minColumns={2} />,
            );

            const toggleBtn = screen.getByRole('button', {
                name: /select visible columns/i,
            });
            await toggleBtn.click();

            const checkboxes = screen.getAllByRole('checkbox');
            const col1Switch = checkboxes[0];
            const col3Switch = checkboxes[2];

            expect(col1Switch).toBeDisabled();

            expect(col3Switch).not.toBeDisabled();
        });
    });

    describe('Apply Button', () => {
        it('should render the apply button if handleApplyOptions is provided and fire it on click', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer
                    {...baseProps}
                    handleApplyOptions={mockHandleApplyOptions}
                />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            const applyBtn = screen.getByRole('button', { name: /apply/i });
            expect(applyBtn).toBeInTheDocument();

            await user.click(applyBtn);
            expect(mockHandleApplyOptions).toHaveBeenCalledTimes(1);
        });

        it('should disable the apply button if isDisabled prop is true', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer
                    {...baseProps}
                    handleApplyOptions={mockHandleApplyOptions}
                    isDisabled={true}
                />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            const applyBtn = screen.getByRole('button', { name: /apply/i });
            expect(applyBtn).toBeDisabled();
        });

        it('should NOT render the apply button if handleApplyOptions is not provided', async () => {
            const user = userEvent.setup();
            renderWithThemeAndIntlProvider(
                <ColumnsSelectDrawer
                    {...baseProps}
                    handleApplyOptions={undefined}
                />,
            );

            await user.click(
                screen.getByRole('button', { name: /select visible columns/i }),
            );

            expect(
                screen.queryByRole('button', { name: /apply/i }),
            ).not.toBeInTheDocument();
        });
    });
});
