import React, { FunctionComponent, useCallback } from 'react';

import ReportIcon from '@mui/icons-material/Report';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
} from '@mui/material';
import { formatThousand } from 'bluesquare-components';
// @ts-ignore
import ConfirmDialog from '../../../../components/dialogs/ConfirmDialogComponent';

import { Selection } from '../../types/selection';
import { OrgUnitChangeRequest } from '../types';

type Props = {
    open: boolean;
    closeDialog: () => void;
    selection: Selection<OrgUnitChangeRequest>;
};

export const MultiActionsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    selection: { selectCount, selectedItems, unSelectedItems, selectAll },
}) => {
    const handleSave = useCallback(() => {
        console.log('save');
        //  We should reset selection to initial state
        // call api to save selected items bulk changes (approve or reject)
        // invalidate react-query cache
        // close dialog
    }, []);
    if (!open) {
        return null;
    }
    return (
        <Dialog
            fullWidth
            maxWidth="xs"
            open={open}
            onClose={(_event, reason) => {
                if (reason === 'backdropClick') {
                    closeDialog();
                }
            }}
            scroll="body"
        >
            <DialogTitle>TITLE</DialogTitle>
            <DialogContent>CONTENT</DialogContent>
            <DialogActions>
                <Button onClick={closeDialog} color="primary">
                    CANCEL
                </Button>

                <ConfirmDialog
                    withDivider
                    btnMessage="VALDATE"
                    question={
                        <Box>
                            <ReportIcon color="error" fontSize="large" />
                            CONFIRM
                            <ReportIcon color="error" fontSize="large" />
                        </Box>
                    }
                    message={
                        <Typography
                            variant="body2"
                            color="error"
                            component="span"
                        >
                            {formatThousand(selectCount)}
                        </Typography>
                    }
                    confirm={handleSave}
                    btnDisabled={false}
                    btnVariant="text"
                />
            </DialogActions>
        </Dialog>
    );
};
