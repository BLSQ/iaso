import React, { FunctionComponent } from 'react';
import ReportIcon from '@mui/icons-material/Report';
import { ConfirmCancelModal, useSafeIntl } from 'bluesquare-components';
import { Box, Typography } from '@mui/material';
import MESSAGES from '../messages';
import { SxStyles } from '../../../types/general';
import { NumberCell } from '../../../components/Cells/NumberCell';

type Props = {
    onConfirm: () => void;
    selectCount: number;
    closeDialog: () => void;
    open: boolean;
};

const styles: SxStyles = {
    warningTitle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    warningIcon: {
        display: 'inline-block',
        marginLeft: theme => theme.spacing(1),
        marginRight: theme => theme.spacing(1),
    },
    warningMessage: {
        display: 'flex',
        justifyContent: 'center',
    },
};

export const BulkEditWarning: FunctionComponent<Props> = ({
    onConfirm,
    selectCount,
    closeDialog,
    open,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmCancelModal
            open={open}
            closeDialog={closeDialog}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            titleMessage={
                <Box sx={styles.warningTitle}>
                    <ReportIcon
                        sx={styles.warningIcon}
                        color="error"
                        fontSize="large"
                    />
                    {formatMessage(MESSAGES.confirmBulkChange)}
                    <ReportIcon
                        sx={styles.warningIcon}
                        color="error"
                        fontSize="large"
                    />
                </Box>
            }
            onCancel={() => null}
            onConfirm={onConfirm}
            id="confirmBulkEditPayments"
            onClose={() => null}
            dataTestId="confirmBulkEditPayments"
        >
            <Typography
                variant="body2"
                color="error"
                component="span"
                sx={styles.warningMessage}
            >
                {formatMessage(MESSAGES.bulkChangeCount, {
                    count: <NumberCell value={selectCount} />,
                })}
            </Typography>
        </ConfirmCancelModal>
        // <ConfirmDialog
        //     withDivider
        //     btnMessage={formatMessage(MESSAGES.confirm)}
        //     question={
        // <Box sx={styles.warningTitle}>
        //     <ReportIcon
        //         sx={styles.warningIcon}
        //         color="error"
        //         fontSize="large"
        //     />
        //     {formatMessage(MESSAGES.confirmBulkChange)}
        //     <ReportIcon
        //         sx={styles.warningIcon}
        //         color="error"
        //         fontSize="large"
        //     />
        // </Box>
        //     }
        //     message={
        // <Typography
        //     variant="body2"
        //     color="error"
        //     component="span"
        //     sx={styles.warningMessage}
        // >
        //     {formatMessage(MESSAGES.bulkChangeCount, {
        //         count: <NumberCell value={selectCount} />,
        //     })}
        // </Typography>
        //     }
        //     confirm={onConfirm}
        //     btnDisabled={disabled}
        //     btnVariant="text"
        // />
    );
};
