import React, { FunctionComponent } from 'react';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import { Box, Grid, IconButton } from '@mui/material';
import { AlertModal, makeFullModal, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { APIImportBaseInfo } from 'Iaso/domains/apiimports/components/APIImportBaseInfo';
import { APIImport } from 'Iaso/domains/apiimports/types/apiimport';
import { SxStyles } from '../../../types/general';
import MESSAGES from '../messages';

export type Props = {
    apiImport: APIImport;
    isOpen: boolean;
    closeDialog: () => void;
};
const styles: SxStyles = {
    pre: {
        textAlign: 'start',
        margin: '16px',
        padding: '5px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        overflowX: 'hidden',
        overflowY: 'auto',
        minWidth: 0,
        fontSize: '12px',
    },
};

const APIImportModal: FunctionComponent<Props> = ({
    apiImport,
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
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
                        <APIImportBaseInfo apiImport={apiImport} size="small" />
                    </WidgetPaper>
                </Grid>
                <Grid item xs={6}>
                    {apiImport.headers && (
                        <WidgetPaper
                            style={{ height: '100%' }}
                            title={formatMessage(MESSAGES.headers)}
                        >
                            <Box component="pre" sx={styles.pre}>
                                {JSON.stringify(apiImport.headers, null, 2)}
                            </Box>
                        </WidgetPaper>
                    )}
                </Grid>
            </Grid>

            {apiImport.json_body && (
                <Box sx={{ mt: 2 }}>
                    <WidgetPaper title={formatMessage(MESSAGES.json_body)}>
                        <Box component="pre" sx={styles.pre}>
                            {JSON.stringify(apiImport.json_body, null, 2)}
                        </Box>
                    </WidgetPaper>
                </Box>
            )}
            {apiImport.exception && (
                <Box sx={{ mt: 2 }}>
                    <WidgetPaper title={formatMessage(MESSAGES.exception)}>
                        <Box component="pre" sx={styles.pre}>
                            {apiImport.exception}
                        </Box>
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
