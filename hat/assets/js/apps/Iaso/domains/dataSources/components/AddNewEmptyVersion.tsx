import { Grid, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent, ReactNode, useState } from 'react';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { useCreateSourceVersion } from '../requests';
import { VersionDescription } from './VersionDescription';

type Props = {
    renderTrigger: ({ openDialog }: { openDialog: any }) => ReactNode;
    sourceId: number;
};

export const AddNewEmptyVersion: FunctionComponent<Props> = ({
    renderTrigger,
    sourceId,
}) => {
    const [description, setDescription] = useState<string>('');
    const { mutateAsync: createSourceVersion } = useCreateSourceVersion();
    const { formatMessage } = useSafeIntl();

    const reset = () => {
        setDescription('');
    };

    const submit = async (closeDialogCallBack: () => void) => {
        const body = {
            dataSourceId: sourceId,
            description: description || null,
        };
        await createSourceVersion(body);
        closeDialogCallBack();
        reset();
    };

    const onConfirm = async (closeDialog: () => void) => {
        await submit(closeDialog);
    };

    const titleMessage = formatMessage(MESSAGES.newEmptyVersion);

    const allowConfirm = !createSourceVersion.isLoading;
    const onChangeDescription = (_field, value) => {
        setDescription(value);
    };

    return (
        // @ts-ignore
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={titleMessage}
            onConfirm={onConfirm}
            onClosed={reset}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            allowConfirm={allowConfirm}
            dataTestId="new-empty-version-modal"
        >
            {createSourceVersion.isLoading && <LoadingSpinner />}

            <Grid container spacing={4}>
                <Grid item>
                    <Typography>
                        {formatMessage(MESSAGES.newEmptyVersionDescription)}
                    </Typography>
                </Grid>

                <Grid xs={12} item>
                    <VersionDescription
                        formValue={description}
                        onChangeDescription={onChangeDescription}
                    />
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
