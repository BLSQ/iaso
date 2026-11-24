import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ENTITIES_WRITE } from '../../../utils/permissions';
import { useGetEntitiesApiParams } from '../hooks/requests';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import {
    EntityActions,
    EntityActionsMenu,
    EntityRestoreButton,
} from './EntityActions';

const mocks = vi.hoisted(() => ({
    userHasPermission: vi.fn(),
    deleteEntity: vi.fn(),
    restoreEntity: vi.fn(),
    useSoftDeleteEntity: vi.fn(),
}));

vi.mock('../../users/utils', async importOriginal => ({
    ...(await importOriginal<any>()),
    userHasPermission: mocks.userHasPermission,
}));

vi.mock('../hooks/requests', async importOriginal => ({
    ...(await importOriginal<any>()),
    useSoftDeleteEntity: (onSuccess?: () => void) => {
        mocks.useSoftDeleteEntity(onSuccess);
        return { mutate: mocks.deleteEntity };
    },
    useRestoreEntity: () => ({ mutate: mocks.restoreEntity }),
}));

const activeEntity = {
    id: 12,
    has_duplicates: true,
    deleted_at: null,
} as unknown as Entity;
const deletedEntity = {
    ...activeEntity,
    deleted_at: '2026-11-24T10:00:00Z',
} as Entity;

const renderActions = (entity: Entity) =>
    renderWithThemeAndIntlProvider(
        <MemoryRouter>
            <EntityActions entity={entity} />
        </MemoryRouter>,
    );

const getDialog = () => screen.findByRole('dialog');
// Icon buttons have a tooltip but no accessible name: find them by their MUI icon
const queryIconButton = (icon: 'DeleteIcon' | 'RestoreFromTrashIcon') =>
    screen.queryByTestId(icon)?.closest('button') ?? null;
const getIconButton = (icon: 'DeleteIcon' | 'RestoreFromTrashIcon') => {
    const button = queryIconButton(icon);
    expect(button).not.toBeNull();
    return button as HTMLElement;
};

describe('EntityActions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.userHasPermission.mockImplementation(
            permission => permission === ENTITIES_WRITE,
        );
    });

    it('hides delete and restore without the entities write permission', () => {
        mocks.userHasPermission.mockReturnValue(false);
        renderActions(activeEntity);

        expect(queryIconButton('DeleteIcon')).toBeNull();
        expect(queryIconButton('RestoreFromTrashIcon')).toBeNull();
        expect(mocks.userHasPermission.mock.calls[0][0]).toBe(ENTITIES_WRITE);
    });

    it('deletes an active entity after confirmation', async () => {
        const user = userEvent.setup();
        renderActions(activeEntity);
        expect(queryIconButton('RestoreFromTrashIcon')).toBeNull();
        expect(screen.getByTestId('FileCopyIcon')).toBeInTheDocument();

        await user.click(getIconButton('DeleteIcon'));
        const dialog = await getDialog();
        expect(dialog).toHaveTextContent(MESSAGES.deleteTitle.defaultMessage);
        expect(dialog).toHaveTextContent(
            MESSAGES.deleteEntityText.defaultMessage,
        );
        expect(mocks.deleteEntity).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: /yes/i }));
        await waitFor(() =>
            expect(mocks.deleteEntity).toHaveBeenCalledWith(activeEntity.id),
        );
    });

    it('does not delete when the dialog is cancelled', async () => {
        const user = userEvent.setup();
        renderActions(activeEntity);

        await user.click(getIconButton('DeleteIcon'));
        await getDialog();
        await user.click(screen.getByRole('button', { name: /no/i }));
        expect(mocks.deleteEntity).not.toHaveBeenCalled();
    });

    it('offers restore instead of delete on a deleted entity, and hides duplicates', async () => {
        const user = userEvent.setup();
        renderActions(deletedEntity);
        expect(queryIconButton('DeleteIcon')).toBeNull();
        expect(screen.queryByTestId('FileCopyIcon')).not.toBeInTheDocument();

        await user.click(getIconButton('RestoreFromTrashIcon'));
        const dialog = await getDialog();
        expect(dialog).toHaveTextContent(MESSAGES.restoreText.defaultMessage);

        await user.click(screen.getByRole('button', { name: /yes/i }));
        await waitFor(() =>
            expect(mocks.restoreEntity).toHaveBeenCalledWith(deletedEntity.id),
        );
        expect(mocks.deleteEntity).not.toHaveBeenCalled();
    });
});

describe('Entity details actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.userHasPermission.mockImplementation(
            permission => permission === ENTITIES_WRITE,
        );
    });

    const openMenu = () =>
        userEvent.click(
            screen.getByRole('button', {
                name: MESSAGES.moreActions.defaultMessage,
            }),
        );

    it('deletes from the card menu and calls onDeleted', async () => {
        const user = userEvent.setup();
        const onDeleted = vi.fn();
        renderWithThemeAndIntlProvider(
            <EntityActionsMenu entity={activeEntity} onDeleted={onDeleted} />,
        );
        expect(mocks.useSoftDeleteEntity).toHaveBeenCalledWith(onDeleted);

        await openMenu();
        await user.click(
            screen.getByRole('menuitem', {
                name: MESSAGES.delete.defaultMessage,
            }),
        );
        // The menu closes, the confirmation stays open
        const dialog = await getDialog();
        expect(dialog).toHaveTextContent(
            MESSAGES.deleteEntityText.defaultMessage,
        );
        expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
        expect(mocks.deleteEntity).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: /yes/i }));
        await waitFor(() =>
            expect(mocks.deleteEntity).toHaveBeenCalledWith(activeEntity.id),
        );
    });

    it('has no card menu on a deleted entity or without permission', () => {
        const { unmount } = renderWithThemeAndIntlProvider(
            <EntityActionsMenu entity={deletedEntity} />,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        unmount();

        mocks.userHasPermission.mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <EntityActionsMenu entity={activeEntity} />,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('restores a deleted entity from its banner button', async () => {
        const user = userEvent.setup();
        renderWithThemeAndIntlProvider(
            <EntityRestoreButton entity={deletedEntity} />,
        );

        await user.click(
            screen.getByRole('button', {
                name: MESSAGES.restore.defaultMessage,
            }),
        );
        const dialog = await getDialog();
        expect(dialog).toHaveTextContent(MESSAGES.restoreText.defaultMessage);

        await user.click(screen.getByRole('button', { name: /yes/i }));
        await waitFor(() =>
            expect(mocks.restoreEntity).toHaveBeenCalledWith(deletedEntity.id),
        );
    });

    it('has no restore button on an active entity or without permission', () => {
        const { unmount } = renderWithThemeAndIntlProvider(
            <EntityRestoreButton entity={activeEntity} />,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        unmount();

        mocks.userHasPermission.mockReturnValue(false);
        renderWithThemeAndIntlProvider(
            <EntityRestoreButton entity={deletedEntity} />,
        );
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});

describe('useGetEntitiesApiParams', () => {
    const baseParams = {
        order: 'id',
        page: '1',
        pageSize: '20',
        tab: 'list',
        isSearchActive: 'true',
        cursor: 'null',
    };

    it('only asks for active entities by default', () => {
        const { url } = useGetEntitiesApiParams(baseParams);
        expect(url).not.toContain('deletion_status');
    });

    it('asks for active and deleted entities with "show deleted"', () => {
        const { url } = useGetEntitiesApiParams({
            ...baseParams,
            showDeleted: 'true',
        });
        expect(url).toContain('deletion_status=all');
    });
});
