import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { baseUrls } from 'Iaso/constants/urls';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { NO_PERIOD } from '../../periods/constants';
import { FormActions, shouldShowRestoreAction } from './FormActions';

const permissionMocks = vi.hoisted(() => ({
    userHasPermission: vi.fn(() => true),
    userHasOneOfPermissions: vi.fn(() => true),
}));

vi.mock('../../users/utils', async importOriginal => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        userHasPermission: permissionMocks.userHasPermission,
        userHasOneOfPermissions: permissionMocks.userHasOneOfPermissions,
    };
});

const restoreFormMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('../hooks/useRestoreForm', () => ({
    useRestoreForm: () => ({ mutateAsync: restoreFormMock }),
}));

// The installed bluesquare-components does not expose ActionsCell yet:
// stub it with a flat renderer so these tests assert FormActions' own logic
// (which actions exist, their urls and callbacks), not the menu mechanics.
vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual<any>('bluesquare-components');
    const labelText = (label: any): string =>
        typeof label === 'string' ? label : (label?.defaultMessage ?? '');
    const renderAction = (action: any): React.ReactNode => {
        if (!action || action.hidden) return null;
        if (action.type === 'divider') return <hr key={action.key} />;
        if (action.type === 'header')
            return <div key={action.key}>{labelText(action.label)}</div>;
        const custom =
            action.renderMenuItem ?? action.renderInline ?? action.render;
        if (custom) {
            return (
                <React.Fragment key={action.key}>
                    {custom({
                        action,
                        closeMenu: () => undefined,
                        inMenu: true,
                    })}
                </React.Fragment>
            );
        }
        if (action.children) {
            return (
                <React.Fragment key={action.key}>
                    <span>{labelText(action.label)}</span>
                    {action.children.map(renderAction)}
                </React.Fragment>
            );
        }
        if (action.url) {
            return (
                <a
                    key={action.key}
                    data-testid={`action-${action.key}`}
                    href={action.url}
                >
                    {labelText(action.label)}
                </a>
            );
        }
        return (
            <button
                key={action.key}
                type="button"
                data-testid={`action-${action.key}`}
                onClick={action.onClick}
            >
                {labelText(action.label)}
            </button>
        );
    };
    return {
        ...actual,
        ActionsCell: ({ actions }: { actions: any[] }) => (
            <div>{actions.map(renderAction)}</div>
        ),
    };
});

vi.mock('../../instances/components/CreateReAssignDialogComponent', () => ({
    CreateReAssignDialogComponent: ({ isOpen }: { isOpen: boolean }) =>
        isOpen ? (
            <div data-testid="create-submission-dialog">Create submission</div>
        ) : null,
}));

vi.mock('../../../components/dialogs/DeleteDialogComponent', () => ({
    default: ({
        onConfirm,
        Trigger,
        defaultOpen,
    }: {
        onConfirm: () => void;
        Trigger?: React.ComponentType<any>;
        defaultOpen?: boolean;
    }) => (
        <>
            {Trigger ? <Trigger onClick={() => undefined} /> : null}
            {defaultOpen && (
                <button
                    type="button"
                    data-testid="delete-confirm"
                    onClick={() => onConfirm()}
                >
                    Confirm delete
                </button>
            )}
        </>
    ),
}));

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
        permissionMocks.userHasPermission.mockReturnValue(true);
        permissionMocks.userHasOneOfPermissions.mockReturnValue(true);
    });

    it('opens the create submission dialog from the menu', () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        fireEvent.click(screen.getByText('Create submission'));
        expect(
            screen.getByTestId('create-submission-dialog'),
        ).toBeInTheDocument();
    });

    it('shows view submissions button', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} />,
        );
        expect(container.innerHTML).toContain(
            '/forms/submissions/list/formIds/1/tab/list/isSearchActive/true',
        );
    });

    it('shows edit button', () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        const edit = screen.getByTestId('action-edit');
        expect(edit).toBeInTheDocument();
        expect(edit).toHaveAttribute('href', '/forms/detail/formId/1');
    });

    it('hides permission-gated actions when the user lacks permissions', () => {
        permissionMocks.userHasPermission.mockReturnValue(false);
        permissionMocks.userHasOneOfPermissions.mockReturnValue(false);
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        expect(screen.queryByTestId('action-edit')).toBeNull();
        expect(screen.queryByTestId('action-viewInstances')).toBeNull();
        expect(screen.queryByText('Create submission')).toBeNull();
    });

    it('opens the delete dialog from the menu and deletes on confirm', () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        // The dialog is hoisted outside the menu: it must appear (and stay)
        // after the menu action is clicked, and only confirm deletes.
        fireEvent.click(screen.getByText('Delete'));
        expect(screen.getByTestId('delete-confirm')).toBeInTheDocument();
        expect(deleteFormMock).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId('delete-confirm'));
        expect(deleteFormMock).toHaveBeenCalledWith({ id: 1 });
    });

    it('shows dhis2 action when enabled', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} hasDhis2Module />,
        );
        expect(screen.getByTestId('action-dhis2Mapping')).toBeInTheDocument();
        expect(container.innerHTML).toContain('/forms/mappings/formId/1');
    });

    it('hides dhis2 action when disabled', () => {
        const { container } = renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} hasDhis2Module={false} />,
        );
        expect(container.innerHTML).not.toContain('/forms/mappings/formId/1');
    });

    it('shows download XLS/XML actions', () => {
        renderWithThemeAndIntlProvider(<FormActions {...defaultProps} />);
        expect(screen.getByTestId('action-xls')).toHaveAttribute(
            'href',
            '/test.xls',
        );
        expect(screen.getByTestId('action-xml')).toHaveAttribute(
            'href',
            '/test.xml',
        );
    });

    it('shows only the restore action for deleted forms', () => {
        renderWithThemeAndIntlProvider(
            <FormActions {...defaultProps} onlyDeleted />,
        );
        fireEvent.click(screen.getByTestId('action-restore'));
        expect(restoreFormMock).toHaveBeenCalledWith(1);
        expect(screen.queryByTestId('action-edit')).toBeNull();
    });
});
