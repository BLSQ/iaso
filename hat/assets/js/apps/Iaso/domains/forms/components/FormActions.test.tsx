import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { baseUrls } from 'Iaso/constants/urls';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { NO_PERIOD } from '../../periods/constants';
import { shouldShowRestoreAction, FormActions } from './FormActions';

describe('shouldShowRestoreAction', () => {
    it('shows restore for all rows in onlyDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: true,
                showDeleted: false,
                deletedAt: null,
            }),
        ).toBe(true);
    });

    it('shows restore for deleted rows in showDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: true,
                deletedAt: '2026-04-20T10:00:00Z',
            }),
        ).toBe(true);
    });

    it('keeps normal actions for non-deleted rows in showDeleted mode', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: true,
                deletedAt: null,
            }),
        ).toBe(false);
    });

    it('keeps normal actions when no deleted filter is active', () => {
        expect(
            shouldShowRestoreAction({
                onlyDeleted: false,
                showDeleted: false,
                deletedAt: '2026-04-20T10:00:00Z',
            }),
        ).toBe(false);
    });
});
vi.mock('../../../components/DisplayIfUserHasPerm', () => ({
    DisplayIfUserHasPerm: ({ children }: { children: React.ReactNode }) =>
        children,
}));

vi.mock('./CreateSubmissionModal/CreateSubmissionModal', () => ({
    CreateSubmissionModal: () => (
        <button data-testid="create-submission">
            Add a submission for this form
        </button>
    ),
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');
    return {
        ...actual,
        IconButton: (props: any) => (
            <button
                data-testid={`icon-${props.icon}`}
                data-url={props.url}
                onClick={props.onClick}
            />
        ),
    };
});

vi.mock('../../../components/dialogs/DeleteDialogComponent', () => ({
    default: ({
        onConfirm,
    }: {
        onConfirm: (closeDialog: () => void) => void;
    }) => (
        <button data-testid="icon-delete" onClick={() => onConfirm(vi.fn())}>
            Delete
        </button>
    ),
}));

const deleteFormMock = vi.fn(() => Promise.resolve());
const defaultProps = {
    settings: {
        row: {
            original: {
                id: 1,
                deleted_at: null,
                has_mappings: true,
                period_type: NO_PERIOD,
                org_unit_type_ids: [1],
                latest_form_version: {
                    xls_file: '/test.xls',
                    file: '/test.xml',
                },
            },
        },
    },
    orgUnitId: '',
    baseUrls,
    onlyDeleted: false,
    showDeleted: false,
    hasDhis2Module: true,
    deleteForm: deleteFormMock,
};

describe('FormActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows create submission button', () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        expect(screen.getByTestId('create-submission')).toBeInTheDocument();
    });

    it('shows view submissions button', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions
                {...defaultProps}
                onlyDeleted={false}
                showDeleted={false}
            />,
        );
        expect(container.innerHTML).toContain(
            '/forms/submissions/list/formIds/1/tab/list/isSearchActive/true',
        );
    });

    it('shows edit button', () => {
        renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} deleteForm={vi.fn()} />,
        );
        const editIcon = screen.getByTestId('icon-edit');
        expect(editIcon).toBeInTheDocument();
        expect(editIcon).toHaveAttribute('data-url', '/forms/detail/formId/1');
    });

    it('shows delete form button', async () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        fireEvent.click(screen.getByTestId('icon-delete'));
        expect(deleteFormMock).toHaveBeenCalledWith({ id: 1 });
    });

    it('shows dhis2 action when enabled', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} hasDhis2Module />,
        );
        expect(screen.getByTestId('icon-dhis')).toBeInTheDocument();
        expect(container.innerHTML).toContain('/forms/mappings/formId/1');
    });

    it('hides dhis2 action when disabled', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} hasDhis2Module={false} />,
        );
        expect(container.innerHTML).not.toContain('/forms/mappings/formId/1');
    });

    it('shows Download XLS/XML button', () => {
        renderWithThemeAndIntlProvider(
            <MemoryRouter>
                <FormActions {...defaultProps} />
            </MemoryRouter>,
        );
        fireEvent.click(screen.getAllByRole('button').pop()!);
        expect(screen.getByText('XLS')).toBeInTheDocument();
        expect(screen.getByText('XML')).toBeInTheDocument();
    });
});
