import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { FormVersionDiff } from '../../forms/requests';
import { SaveFormDialog } from './SaveFormDialog';

const { mockPreview, mockSaveVersion } = vi.hoisted(() => ({
    mockPreview: vi.fn(),
    mockSaveVersion: vi.fn(),
}));

vi.mock('bluesquare-components', async () => {
    const actual = await vi.importActual('bluesquare-components');
    return {
        ...actual,
        useSafeIntl: (await import('../../../../../tests/mocks/safeIntl'))
            .mockUseSafeIntl,
    };
});

vi.mock('../hooks/requests/previewFormAIVersion', () => ({
    previewFormAIVersion: mockPreview,
}));

vi.mock('../hooks/requests/useSaveFormVersion', () => ({
    useSaveFormVersion: () => ({
        mutateAsync: mockSaveVersion,
        isLoading: false,
    }),
}));

vi.mock('../hooks/requests/useCreateForm', () => ({
    useCreateForm: () => ({ mutateAsync: vi.fn(), isLoading: false }),
}));

vi.mock('../../../domains/projects/hooks/requests', () => ({
    useGetProjectsDropdownOptions: () => ({ data: [] }),
}));

// fetches the workflows' questions: covered by its own tests
vi.mock('../../forms/components/FormVersionsDiffConfirmation', () => ({
    default: ({ formId }: { formId: number }) => (
        <div>{`diff confirmation of form ${formId}`}</div>
    ),
}));

const emptyDiff: FormVersionDiff = {
    previous_version_id: '1',
    added_questions: [],
    removed_questions: [],
    modified_questions: [],
    configuration_impacts: [],
};

const renderDialog = (onSaveNewVersion = vi.fn(), onClose = vi.fn()) =>
    renderWithThemeAndIntlProvider(
        <SaveFormDialog
            open
            onClose={onClose}
            xlsformUuid="uuid-1"
            selectedFormId={11}
            selectedFormName="Child form"
            onSaveNewVersion={onSaveNewVersion}
            onSaveNewForm={vi.fn()}
        />,
    );

const clickSave = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

describe('SaveFormDialog - new version', () => {
    beforeEach(() => {
        mockPreview.mockReset();
        mockSaveVersion.mockReset();
        mockSaveVersion.mockResolvedValue({ id: 5, version_id: '2' });
    });

    it('saves right away when no question is removed or retyped', async () => {
        mockPreview.mockResolvedValue(emptyDiff);
        const onSaveNewVersion = vi.fn();
        renderDialog(onSaveNewVersion);

        clickSave();

        await waitFor(() => expect(onSaveNewVersion).toHaveBeenCalled());
        expect(mockPreview).toHaveBeenCalledWith(11, 'uuid-1');
        expect(mockSaveVersion).toHaveBeenCalledWith({
            formId: 11,
            xlsformUuid: 'uuid-1',
        });
        expect(screen.queryByText(/diff confirmation/)).not.toBeInTheDocument();
    });

    it('asks for confirmation when questions are removed, then saves', async () => {
        mockPreview.mockResolvedValue({
            ...emptyDiff,
            removed_questions: [{ name: 'age', label: 'Age', type: 'integer' }],
        });
        const onSaveNewVersion = vi.fn();
        renderDialog(onSaveNewVersion);

        clickSave();

        expect(
            await screen.findByText('diff confirmation of form 11'),
        ).toBeInTheDocument();
        expect(mockSaveVersion).not.toHaveBeenCalled();

        clickSave();

        await waitFor(() => expect(onSaveNewVersion).toHaveBeenCalled());
        expect(mockPreview).toHaveBeenCalledTimes(1);
    });

    it('goes back to the save options when the confirmation is cancelled', async () => {
        mockPreview.mockResolvedValue({
            ...emptyDiff,
            modified_questions: [
                {
                    name: 'age',
                    label: 'Age',
                    old_type: 'integer',
                    new_type: 'text',
                },
            ],
        });
        const onClose = vi.fn();
        renderDialog(vi.fn(), onClose);

        clickSave();
        await screen.findByText('diff confirmation of form 11');
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

        expect(screen.queryByText(/diff confirmation/)).not.toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Save as new version' }),
        ).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(mockSaveVersion).not.toHaveBeenCalled();
    });

    it('still saves when the preview fails, the save reporting the error', async () => {
        mockPreview.mockRejectedValue(new Error('boom'));
        renderDialog();

        clickSave();

        await waitFor(() => expect(mockSaveVersion).toHaveBeenCalled());
    });
});
