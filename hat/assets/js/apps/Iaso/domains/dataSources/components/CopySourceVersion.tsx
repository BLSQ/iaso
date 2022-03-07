/* eslint-disable camelcase */
import React, { FunctionComponent, ReactNode, useCallback } from 'react';
// import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import { Grid } from '@material-ui/core';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
// import { ModalSubTitle } from '../../../components/forms/ModalSubTitle';
import MESSAGES from '../messages';
import { useCopyDataSourceVersion } from '../requests';

type Props = {
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }) => ReactNode;
    dataSourceId: number;
    dataSourceVersionNumber: number;
};

export const CopySourceVersion: FunctionComponent<Props> = ({
    renderTrigger,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    // const { formatMessage } = useSafeIntl();
    const { mutate: copyVersion } = useCopyDataSourceVersion();

    const onConfirm = useCallback(
        closeDialog => {
            copyVersion({ dataSourceId, dataSourceVersionNumber });
            closeDialog();
        },
        [copyVersion, dataSourceId, dataSourceVersionNumber],
    );

    return (
        <ConfirmCancelDialogComponent
            id="copySourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            // onClosed={reset}
            confirmMessage={MESSAGES.copy}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            allowConfirm
            // titleMessage={{
            //     ...MESSAGES.exportDataSource,
            //     values: { dataSourceName },
            // }}
            titleMessage={MESSAGES.copyVersion}
            // Not defining these props makes TS unhappy (probably something with TS and PropTypes)
            additionalButton={false}
            onCancel={undefined}
            additionalMessage={undefined}
            onAdditionalButtonClick={undefined}
            allowConfimAdditionalButton={undefined}
        >
            <Grid container spacing={2}>
                <Grid container item spacing={2}>
                    <div>WARNING MESSAGE WITH RED ICON</div>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
