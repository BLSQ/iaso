/* eslint-disable camelcase */
import React, { FunctionComponent, ReactNode, useCallback } from 'react';
import { Grid, Box, Typography, Divider } from '@material-ui/core';
import { FormattedMessage } from 'react-intl';
import { useDispatch } from 'react-redux';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../messages';
import { useCopyDataSourceVersion } from '../requests';
import { redirectTo } from '../../../routing/actions';
import { baseUrls } from '../../../constants/urls';

type Props = {
    // eslint-disable-next-line no-unused-vars
    renderTrigger: ({ openDialog }) => ReactNode;
    dataSourceId: number;
    dataSourceVersionNumber: number;
    dataSourceName: string;
};

export const CopySourceVersion: FunctionComponent<Props> = ({
    renderTrigger,
    dataSourceName,
    dataSourceId,
    dataSourceVersionNumber,
}) => {
    const { mutateAsync: copyVersion } = useCopyDataSourceVersion();
    const dispatch = useDispatch();

    const onConfirm = useCallback(
        closeDialog => {
            copyVersion({ dataSourceId, dataSourceVersionNumber });
            closeDialog();
        },
        [copyVersion, dataSourceId, dataSourceVersionNumber],
    );

    const onRedirect = useCallback(
        async closeDialog => {
            await copyVersion({ dataSourceId, dataSourceVersionNumber });
            closeDialog();
            dispatch(
                redirectTo(baseUrls.tasks, {
                    order: '-created_at',
                }),
            );
        },
        [copyVersion, dataSourceId, dataSourceVersionNumber, dispatch],
    );

    return (
        <ConfirmCancelDialogComponent
            id="copySourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.copy}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            allowConfirm
            titleMessage={{
                ...MESSAGES.copyVersionWithName,
                values: {
                    sourceName: dataSourceName,
                    versionNumber: dataSourceVersionNumber,
                },
            }}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            allowConfimAdditionalButton
            onAdditionalButtonClick={onRedirect}
            // Not defining these props makes TS unhappy (probably something with TS and PropTypes)
            onCancel={undefined}
        >
            <Grid container spacing={2}>
                <Grid item spacing={2} xs={12}>
                    <Divider />
                </Grid>
                <Grid item spacing={2} xs={12} justifyContent="space-around">
                    <Box mt={2}>
                        <Typography>
                            <FormattedMessage
                                values={{
                                    sourceName: dataSourceName,
                                    versionNumber: dataSourceVersionNumber,
                                }}
                                {...MESSAGES.copyVersionWarning}
                            />
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </ConfirmCancelDialogComponent>
    );
};
