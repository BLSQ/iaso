import { useMemo } from 'react';
import { RECEIVED, TEMPORARY } from '../../constants';
import { FormAUiState } from '../types';

type UseFormAUiStateParams = {
    isNew: boolean;
    withinEditWindow: boolean;
    originalStatus: string;
    currentStatus: string;
};

export const useFormAUiState = ({
    isNew,
    withinEditWindow,
    originalStatus,
    currentStatus,
}: UseFormAUiStateParams): FormAUiState => {
    return useMemo(() => {
        const isTemporary = currentStatus === TEMPORARY;
        const wasOriginallyTemporary = !isNew && originalStatus === TEMPORARY;
        const canEditBaseFields = isNew || withinEditWindow;
        const canEditAfterWindowCompletion =
            wasOriginallyTemporary && !withinEditWindow;
        const canEditReceiptCompletionFields =
            canEditBaseFields || canEditAfterWindowCompletion;

        return {
            isTemporary,
            canEditStatus: canEditBaseFields || canEditAfterWindowCompletion,
            canEditCampaignAndRound: canEditBaseFields,
            canEditReportDate: canEditBaseFields,
            canEditReceptionDate:
                !isTemporary && canEditReceiptCompletionFields,
            canEditVials:
                canEditBaseFields &&
                (!wasOriginallyTemporary || currentStatus === RECEIVED),
            canEditDosesPerVial: canEditBaseFields,
            canEditComment: canEditReceiptCompletionFields,
            canEditFile: !isTemporary && canEditReceiptCompletionFields,
        };
    }, [currentStatus, isNew, originalStatus, withinEditWindow]);
};
