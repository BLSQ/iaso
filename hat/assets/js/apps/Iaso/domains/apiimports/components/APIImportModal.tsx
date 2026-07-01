import React, { FunctionComponent } from 'react';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Box, Grid, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { AlertModal, makeFullModal, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { APIImportBaseInfo } from 'Iaso/domains/apiimports/components/APIImportBaseInfo';
import { APIImport } from 'Iaso/domains/apiimports/types/apiimport';
import MESSAGES from '../messages';

export type Props = {
    apiImport: APIImport;
    isOpen: boolean;
    closeDialog: () => void;
};

const useStyles = makeStyles(() => ({
    pre: {
        textAlign: 'start',
        overflowY: 'scroll',
        margin: '16px',
        padding: '5px',
    },
}));

const APIImportModal: FunctionComponent<Props> = ({
    apiImport,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <AlertModal
            isOpen={isOpen}
            closeDialog={closeDialog}
            titleMessage={''}
            id="task-logs-modal"
            maxWidth="xl"
        >
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <WidgetPaper title={formatMessage(MESSAGES.title)}>
                        <APIImportBaseInfo apiImport={apiImport} />
                    </WidgetPaper>
                </Grid>
                <Grid item xs={6}>
                    {apiImport.headers && (
                        <WidgetPaper
                            style={{ height: '100%' }}
                            title={formatMessage(MESSAGES.headers)}
                        >
                            <pre className={classes.pre}>
                                {JSON.stringify(apiImport.headers, null, 2)}
                            </pre>
                        </WidgetPaper>
                    )}
                </Grid>
            </Grid>

            {apiImport.json_body && (
                <Box sx={{ mt: 2 }}>
                    <WidgetPaper title={formatMessage(MESSAGES.json_body)}>
                        <pre className={classes.pre}>
                            {JSON.stringify(apiImport.json_body, null, 2)}
                        </pre>
                    </WidgetPaper>
                </Box>
            )}
            {apiImport.exception && (
                <Box sx={{ mt: 2 }}>
                    <WidgetPaper title={formatMessage(MESSAGES.exception)}>
                        <pre className={classes.pre}>{apiImport.exception}</pre>
                    </WidgetPaper>
                </Box>
            )}
        </AlertModal>
    );
};

type IconButtonProps = {
    onClick: () => void;
};

const Icon: FunctionComponent<IconButtonProps> = ({ onClick }) => {
    return (
        <IconButton color="default" aria-label="Logs" onClick={onClick}>
            <RemoveRedEyeIcon />
        </IconButton>
    );
};

const modalWithIconButton = makeFullModal(APIImportModal, Icon);

export { modalWithIconButton as APIImportModal };
