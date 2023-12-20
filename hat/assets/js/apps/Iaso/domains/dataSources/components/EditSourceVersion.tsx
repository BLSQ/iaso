import { Box, Divider, Grid } from '@mui/material';
import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import { usePutSourceVersion } from '../requests';

type Props = {
    sourceVersionId: number;
    description: string | null;
    dataSourceId: number;
    sourceVersionNumber: number;
    forceRefreshParent: () => void;
};

const renderTrigger = ({ openDialog }) => (
    <IconButtonComponent
        onClick={openDialog}
        icon="edit"
        tooltipMessage={MESSAGES.edit}
    />
);

export const EditSourceVersion: FunctionComponent<Props> = ({
    sourceVersionId,
    description,
    sourceVersionNumber,
    dataSourceId,
    forceRefreshParent,
}) => {
    const { formatMessage } = useSafeIntl();
    const [updatedDescription, setUpdatedDescription] = useState<string | null>(
        description,
    );
    const { mutateAsync: updateSourceVersion } = usePutSourceVersion();
    const onChange = (_keyValue, input) => {
        setUpdatedDescription(input);
    };

    const onConfirm = useCallback(
        async closeDialog => {
            await updateSourceVersion({
                sourceVersionId,
                description: updatedDescription,
                dataSourceId,
                sourceVersionNumber,
            });
            closeDialog();
            forceRefreshParent();
        },
        [
            dataSourceId,
            forceRefreshParent,
            sourceVersionId,
            sourceVersionNumber,
            updateSourceVersion,
            updatedDescription,
        ],
    );
    const onCancel = useCallback(
        closeDialog => {
            setUpdatedDescription(description);
            closeDialog();
        },
        [description],
    );
    const allowConfirm = (description ?? '') !== updatedDescription;
    return (
        <ConfirmCancelDialogComponent
            dataTestId="editSourceVersionModal"
            id="editSourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            titleMessage={{
                ...MESSAGES.editSourceVersion,
            }}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onCancel={onCancel}
            allowConfirm={allowConfirm}
            // This is to avoid complaints from TS compiler
            allowConfimAdditionalButton={undefined}
            onAdditionalButtonClick={undefined}
        >
            <>
                <Box mb={2}>
                    <Divider />
                </Box>
                <Grid container spacing={2} direction="row">
                    <Grid item xs={12}>
                        <InputComponent
                            type="text"
                            keyValue="description"
                            labelString={formatMessage(
                                MESSAGES.dataSourceDescription,
                            )}
                            value={updatedDescription ?? ''}
                            onChange={onChange}
                        />
                    </Grid>
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
