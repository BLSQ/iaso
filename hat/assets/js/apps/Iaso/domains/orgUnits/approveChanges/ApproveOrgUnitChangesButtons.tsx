/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import MESSAGES from './messages';
import { NewField } from './hooks/useNewFields';
import { UseSaveChangeRequestQueryData } from './hooks/api/useSaveChangeRequest';

type Props = {
    closeDialog: () => void;
    newFields: NewField[];
    isNew: boolean;
    submitChangeRequest: (
        // eslint-disable-next-line no-unused-vars
        variables: UseSaveChangeRequestQueryData,
    ) => void;
};

export const ApproveOrgUnitChangesButtons: FunctionComponent<Props> = ({
    closeDialog,
    newFields,
    isNew,
    submitChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedFields = newFields.filter(field => field.isSelected);
    const handlConfirm = useCallback(() => {
        submitChangeRequest({
            status: 'approved',
            approved_fields: selectedFields.map(field => field.key),
        });
    }, [selectedFields, submitChangeRequest]);
    const handleReject = useCallback(() => {
        submitChangeRequest({
            status: 'rejected',
            approved_fields: [],
            rejection_comment: 'REASON',
        });
    }, [submitChangeRequest]);
    return (
        <Box display="flex" justifyContent="flex-end" m={2}>
            <Button
                onClick={() => {
                    closeDialog();
                }}
                color="primary"
                data-test="cancel-button"
            >
                {formatMessage(MESSAGES.cancel)}
            </Button>
            {isNew && (
                <>
                    <Box pl={1} display="inline-block">
                        <Button
                            data-test="reject-button"
                            onClick={handleReject}
                            variant="contained"
                            color="error"
                            autoFocus
                        >
                            {formatMessage(MESSAGES.reject)}
                        </Button>
                    </Box>
                    <Box pl={1} display="inline-block">
                        <Button
                            data-test="confirm-button"
                            onClick={handlConfirm}
                            variant="contained"
                            color="primary"
                            autoFocus
                            disabled={selectedFields.length === 0}
                        >
                            {formatMessage(MESSAGES.validateSelected)}
                        </Button>
                    </Box>
                </>
            )}
        </Box>
    );
};
