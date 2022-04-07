import { Box, Divider, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import {
    IconButton as IconButtonComponent,
    useSafeIntl,
} from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

type Props = {};
const renderTrigger = ({ openDialog }) => {
    return (
        <IconButtonComponent
            onClick={() => {
                console.log('editing', settings.row.original);
            }}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};
export const GroupedCampaignDialog: FunctionComponent<Props> = () => {
    return (
        <ConfirmCancelDialogComponent
            id="copySourceVersionModal"
            renderTrigger={renderTrigger}
            onConfirm={onConfirm}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.close}
            maxWidth="md"
            titleMessage={{
                ...MESSAGES.copyVersionWithName,
                values: {
                    sourceName: dataSourceName,
                    versionNumber: dataSourceVersionNumber,
                },
            }}
            additionalButton
            additionalMessage={MESSAGES.goToCurrentTask}
            onAdditionalButtonClick={onRedirect}
            onCancel={onCancel}
            dataTestId="copy-source-version-modal"
            allowConfirm={allowConfirm}
            allowConfimAdditionalButton={allowConfirm}
        >
            <>
                <Box mb={2}>
                    <Divider />
                </Box>
                <Grid
                    container
                    spacing={2}
                    direction="row"
                    justifyContent="space-around"
                >
                    TEst
                </Grid>
            </>
        </ConfirmCancelDialogComponent>
    );
};
