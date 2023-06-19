import React, { FunctionComponent } from 'react';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    makeStyles,
    Box,
    Typography,
} from '@material-ui/core';
import {
    commonStyles,
    formatThousand,
    useSafeIntl,
} from 'bluesquare-components';
import ReportIcon from '@material-ui/icons/Report';
import { UseMutateAsyncFunction } from 'react-query';

import MESSAGES from '../messages';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';

import { Selection } from '../../orgUnits/types/selection';
import { Profile } from '../../teams/types/profile';

type SaveData = {
    role?: string;
};
type Props = {
    open: boolean;
    closeDialog: () => void;
    selection: Selection<Profile>;
    saveMulti: UseMutateAsyncFunction<unknown, unknown, unknown, unknown>;
};

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        overflow: 'visible',
    },
    title: {
        paddingBottom: 0,
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme.spacing(2),
    },
    action: {
        paddingBottom: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    warningTitle: {
        display: 'flex',
        alignItems: 'center',
    },
    warningIcon: {
        display: 'inline-block',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    warningMessage: {
        display: 'flex',
        justifyContent: 'center',
    },
}));

export const UsersMultiActionsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    selection: { selectCount, selectedItems, unSelectedItems, selectAll },
    saveMulti,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    const closeAndReset = () => {
        closeDialog();
    };
    const saveAndReset = () => {
        const data: SaveData = {};
        saveMulti(data).then(() => closeAndReset());
    };
    return (
        <>
            <Dialog
                fullWidth
                maxWidth="xs"
                open={open}
                classes={{
                    paper: classes.paper,
                }}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        closeAndReset();
                    }
                }}
                scroll="body"
            >
                <DialogTitle className={classes.title}>
                    {formatMessage(MESSAGES.multiEditTitle, {
                        count: formatThousand(selectCount),
                    })}
                </DialogTitle>
                <DialogContent className={classes.content}>
                    INPUTs
                </DialogContent>
                <DialogActions className={classes.action}>
                    <Button onClick={closeAndReset} color="primary">
                        {formatMessage(MESSAGES.cancel)}
                    </Button>

                    <ConfirmDialog
                        withDivider
                        btnMessage={formatMessage(MESSAGES.validate)}
                        question={
                            <Box className={classes.warningTitle}>
                                <ReportIcon
                                    className={classes.warningIcon}
                                    color="error"
                                    fontSize="large"
                                />
                                {formatMessage(MESSAGES.confirmMultiChange)}
                                <ReportIcon
                                    className={classes.warningIcon}
                                    color="error"
                                    fontSize="large"
                                />
                            </Box>
                        }
                        message={
                            <Typography
                                variant="body2"
                                color="error"
                                component="span"
                                className={classes.warningMessage}
                            >
                                {formatMessage(MESSAGES.bulkChangeCount, {
                                    count: `${formatThousand(selectCount)}`,
                                })}
                            </Typography>
                        }
                        confirm={() => saveAndReset()}
                        btnDisabled
                        btnVariant="text"
                    />
                </DialogActions>
            </Dialog>
        </>
    );
};
