import { useMemo } from 'react';
import {
    EDIT_ACCESS_COMPLETION_ONLY,
    EDIT_ACCESS_FULL,
    RECEIVED,
    TEMPORARY,
} from '../../constants';
import { FormAEditAccess, FormAUiState } from '../types';

type UseFormAUiStateParams = {
    isNew: boolean;
    // Enum from OutgoingStockMovementSerializer.edit_access:
    //  - "full": every field editable (admin any time, non-admin within window)
    //  - "completion_only": only the temporary-completion allowlist editable
    //    (non-admin finishing a temporary Form A past the edit window)
    //  - "none": no edits. Modal should not open in this case; the table hides
    //    the edit button, but the state machine still returns safe defaults.
    editAccess: FormAEditAccess;
    originalStatus: string;
    currentStatus: string;
    // Backend-driven boolean: true when created_at is within the edit window.
    withinEditWindow: boolean;
};

export const useFormAUiState = ({
    isNew,
    editAccess,
    originalStatus,
    currentStatus,
    withinEditWindow,
}: UseFormAUiStateParams): FormAUiState => {
    return useMemo(() => {
        const isTemporary = currentStatus === TEMPORARY;
        const wasOriginallyTemporary = !isNew && originalStatus === TEMPORARY;
        // New forms always get full access; existing rows respect the backend enum.
        const canEditAllFields = isNew || editAccess === EDIT_ACCESS_FULL;
        const canCompleteTemporary =
            wasOriginallyTemporary &&
            editAccess === EDIT_ACCESS_COMPLETION_ONLY;
        const canEditCompletionFields =
            canEditAllFields || canCompleteTemporary;

        // Status toggle is allowed when:
        //  - creating a new form (setting initial status)
        //  - completing a temporary form (temp → received, any time)
        //  - within the edit window with full access (received → temp reversal)
        // Post-window received → temporary is blocked server-side; disable the
        // toggle so the user isn't offered an impossible transition.
        const canEditStatus =
            isNew ||
            canCompleteTemporary ||
            (canEditAllFields && (wasOriginallyTemporary || withinEditWindow));

        return {
            isTemporary,
            canEditStatus,
            canEditCampaignAndRound: canEditAllFields,
            canEditReportDate: canEditAllFields,
            canEditReceptionDate: !isTemporary && canEditCompletionFields,
            canEditVials:
                canEditAllFields &&
                (!wasOriginallyTemporary || currentStatus === RECEIVED),
            canEditDosesPerVial: canEditAllFields,
            canEditComment: canEditCompletionFields,
            canEditFile: !isTemporary && canEditCompletionFields,
        };
    }, [currentStatus, editAccess, isNew, originalStatus, withinEditWindow]);
};
