import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import * as useGetInstancesModule from '../hooks/useGetInstances';
import { FormsFilterComponent } from './FormsFilterComponent';

const mockUseGetColors = vi.fn();

vi.mock('../hooks/useGetInstances', () => ({
    useGetInstances: vi.fn(),
}));

const mockUseGetInstances = vi.mocked(
    useGetInstancesModule.useGetInstances,
) as any;

vi.mock('Iaso/hooks/useGetColors', () => ({
    useGetColors: (arg: boolean) => mockUseGetColors(arg),
    getColor: (index: number, colors: any[]) => {
        if (!colors || colors.length === 0) return '#FF0000';
        return colors[index % colors.length];
    },
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: () => ({
            formatMessage: (msg: { defaultMessage?: string } | string) =>
                typeof msg === 'string' ? msg : (msg?.defaultMessage ?? ''),
        }),
        Select: ({
            keyValue,
            label,
            disabled,
            loading,
            options,
            value,
            onChange,
        }: Record<string, any>) => (
            <div data-testid={`select-${keyValue}`}>
                <label htmlFor={`select-input-${keyValue}`}>
                    {label}
                    <select
                        id={`select-input-${keyValue}`}
                        data-testid={`select-input-${keyValue}`}
                        disabled={Boolean(disabled || loading)}
                        value={
                            Array.isArray(value)
                                ? value.map(v => v.id).join(',')
                                : ''
                        }
                        onChange={event => {
                            const selectedIds = event.target.value
                                .split(',')
                                .filter(id => id !== '');
                            const selectedForms = options.filter(
                                (opt: { id: string }) =>
                                    selectedIds.includes(opt.id),
                            );
                            onChange(selectedForms);
                        }}
                    >
                        <option value="">-- Select forms --</option>
                        {options.map((opt: any) => (
                            <option key={opt.id} value={opt.id}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                </label>
                {loading && (
                    <span data-testid="select-loading">Loading...</span>
                )}
            </div>
        ),
        IconButton: ({
            onClick,
            icon,
            tooltipMessage,
            disabled,
        }: Record<string, any>) => (
            <button
                data-testid={`icon-button-${icon}`}
                onClick={onClick}
                disabled={Boolean(disabled)}
                title={
                    typeof tooltipMessage === 'string'
                        ? tooltipMessage
                        : tooltipMessage?.defaultMessage
                }
            >
                {icon}
            </button>
        ),
        renderTags:
            (getLabel: (obj: any) => string) => (selectedItems: any[]) =>
                selectedItems.map(item => getLabel(item)).join(', '),
    };
});

describe('FormsFilterComponent', () => {
    const mockMapRef = { current: { fitBounds: vi.fn() } };

    const baseProps = {
        formsSelected: [],
        setFormsSelected: vi.fn(),
        currentOrgUnit: { id: 1 },
        map: mockMapRef,
    };

    const mockColorArray = ['#FF0000', '#00FF00', '#0000FF'];

    beforeEach(() => {
        vi.clearAllMocks();
        mockMapRef.current.fitBounds = vi.fn();
        mockUseGetInstances.mockReturnValue({
            data: null,
            isLoading: false,
        });
        mockUseGetColors.mockReturnValue({
            data: mockColorArray,
            isLoading: false,
        });
    });

    describe('Form Grouping Logic (findIndex bug fix)', () => {
        it('should display only one option for 3 instances with same form_id', () => {
            const mockInstances = [
                {
                    id: 1,
                    form_id: 'form1',
                    form_name: 'Form A',
                    latitude: 48.8566,
                    longitude: 2.3522,
                },
                {
                    id: 2,
                    form_id: 'form1',
                    form_name: 'Form A',
                    latitude: 48.86,
                    longitude: 2.35,
                },
                {
                    id: 3,
                    form_id: 'form1',
                    form_name: 'Form A',
                    latitude: 48.865,
                    longitude: 2.355,
                },
            ];

            mockUseGetInstances.mockReturnValue({
                data: { instances: mockInstances },
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            const selectInput = screen.getByTestId('select-input-forms');
            const formOptions = selectInput.querySelectorAll('option');
            const formAOptions = Array.from(formOptions).filter(opt =>
                opt.textContent?.includes('Form A'),
            );
            expect(formAOptions).toHaveLength(1);
        });

        it('should display two separate options for different form_ids', () => {
            const mockInstances = [
                {
                    id: 1,
                    form_id: 'formA',
                    form_name: 'Form A',
                    latitude: 48.8566,
                    longitude: 2.3522,
                },
                {
                    id: 2,
                    form_id: 'formB',
                    form_name: 'Form B',
                    latitude: 48.86,
                    longitude: 2.35,
                },
            ];

            mockUseGetInstances.mockReturnValue({
                data: { instances: mockInstances },
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            const selectInput = screen.getByTestId('select-input-forms');
            expect(selectInput).toHaveTextContent('Form A');
            expect(selectInput).toHaveTextContent('Form B');
        });

        it('should assign different colors to grouped forms', () => {
            const mockInstances = [
                {
                    id: 1,
                    form_id: 'form1',
                    form_name: 'Form A',
                    latitude: 48.8566,
                    longitude: 2.3522,
                },
            ];

            mockUseGetInstances.mockReturnValue({
                data: { instances: mockInstances },
                isLoading: false,
            });

            mockUseGetColors.mockReturnValue({
                data: ['#AABBCC', '#DDDDDD'],
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            expect(mockUseGetColors).toHaveBeenCalledWith(true);
        });
    });

    describe('UI States', () => {
        it('should show loading state when isLoading is true', () => {
            mockUseGetInstances.mockReturnValue({
                data: null,
                isLoading: true,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            expect(screen.getByTestId('select-loading')).toBeInTheDocument();
        });

        it('should disable select when data.instances is empty', () => {
            mockUseGetInstances.mockReturnValue({
                data: { instances: [] },
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            const selectInput = screen.getByTestId('select-input-forms');
            expect(selectInput).toBeDisabled();
        });

        it('should disable select when data is undefined', () => {
            mockUseGetInstances.mockReturnValue({
                data: undefined,
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent {...baseProps} />,
            );

            const selectInput = screen.getByTestId('select-input-forms');
            expect(selectInput).toBeDisabled();
        });
    });

    describe('Filter Interactions', () => {
        it('should call setFormsSelected when form is selected', async () => {
            const user = userEvent.setup();
            const mockInstances = [
                {
                    id: 1,
                    form_id: 'form1',
                    form_name: 'Form A',
                    latitude: 48.8566,
                    longitude: 2.3522,
                },
            ];

            mockUseGetInstances.mockReturnValue({
                data: { instances: mockInstances },
                isLoading: false,
            });

            const setFormsSelected = vi.fn();
            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    setFormsSelected={setFormsSelected}
                />,
            );

            const selectInput = screen.getByTestId('select-input-forms');
            await user.selectOptions(selectInput, 'form1');

            await waitFor(() => {
                expect(setFormsSelected).toHaveBeenCalled();
            });
        });
    });

    describe('Geographic Logic - Bounds Calculation', () => {
        it('should enable fit to bounds button when form has valid coordinates', () => {
            mockUseGetInstances.mockReturnValue({
                data: {
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: 2.3522,
                        },
                    ],
                },
                isLoading: false,
            });

            const selectedForms = [
                {
                    id: 'form1',
                    name: 'Form A',
                    color: '#FF0000',
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: 2.3522,
                        },
                    ],
                },
            ];

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    formsSelected={selectedForms}
                />,
            );

            const fitBoundsButton = screen.getByTestId(
                'icon-button-remove-red-eye',
            );
            expect(fitBoundsButton).not.toBeDisabled();
        });

        it('should disable fit to bounds button when instances have no coordinates', () => {
            mockUseGetInstances.mockReturnValue({
                data: {
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: null,
                            longitude: null,
                        },
                    ],
                },
                isLoading: false,
            });

            const selectedForms = [
                {
                    id: 'form1',
                    name: 'Form A',
                    color: '#FF0000',
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: null,
                            longitude: null,
                        },
                    ],
                },
            ];

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    formsSelected={selectedForms}
                />,
            );

            const fitBoundsButton = screen.getByTestId(
                'icon-button-remove-red-eye',
            );
            expect(fitBoundsButton).toBeDisabled();
        });

        it('should call fitBounds when fit to bounds button is clicked', async () => {
            const user = userEvent.setup();
            mockUseGetInstances.mockReturnValue({
                data: {
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: 2.3522,
                        },
                    ],
                },
                isLoading: false,
            });

            const selectedForms = [
                {
                    id: 'form1',
                    name: 'Form A',
                    color: '#FF0000',
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: 2.3522,
                        },
                    ],
                },
            ];

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    formsSelected={selectedForms}
                />,
            );

            const fitBoundsButton = screen.getByTestId(
                'icon-button-remove-red-eye',
            );
            await user.click(fitBoundsButton);

            expect(mockMapRef.current.fitBounds).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should filter out instances with missing longitude but present latitude', () => {
            mockUseGetInstances.mockReturnValue({
                data: {
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: null,
                        },
                        {
                            id: 2,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.86,
                            longitude: 2.35,
                        },
                    ],
                },
                isLoading: false,
            });

            const selectedForms = [
                {
                    id: 'form1',
                    name: 'Form A',
                    color: '#FF0000',
                    instances: [
                        {
                            id: 1,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.8566,
                            longitude: null,
                        },
                        {
                            id: 2,
                            form_id: 'form1',
                            form_name: 'Form A',
                            latitude: 48.86,
                            longitude: 2.35,
                        },
                    ],
                },
            ];

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    formsSelected={selectedForms}
                />,
            );

            const fitBoundsButton = screen.getByTestId(
                'icon-button-remove-red-eye',
            );
            expect(fitBoundsButton).not.toBeDisabled();
        });

        it('should call useGetInstances with correct orgUnitId', () => {
            const orgUnitId = 42;
            mockUseGetInstances.mockReturnValue({
                data: null,
                isLoading: false,
            });

            renderWithThemeAndIntlProvider(
                <FormsFilterComponent
                    {...baseProps}
                    currentOrgUnit={{ id: orgUnitId }}
                />,
            );

            expect(mockUseGetInstances).toHaveBeenCalledWith({
                orgUnitId,
            });
        });
    });
});
