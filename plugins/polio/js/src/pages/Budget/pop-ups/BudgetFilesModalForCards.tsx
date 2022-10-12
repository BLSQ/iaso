import React, { FunctionComponent, useCallback } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    makeStyles,
    Typography,
} from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { makeFileLinks, makeLinks } from '../utils';
import {
    Nullable,
    Optional,
} from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { LinkWithAlias, FileWithName } from '../types';

type Props = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    note?: Nullable<string>;
    links: Optional<Nullable<LinkWithAlias[]>>;
    files: FileWithName[];
};

const useStyles = makeStyles({
    minModalWidth: { minWidth: '250px' },
});

export const BudgetFilesModalForCards: FunctionComponent<Props> = ({
    open,
    setOpen,
    note,
    links,

    files,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const handleClose = useCallback(() => {
        setOpen(false);
    }, [setOpen]);
    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {formatMessage(MESSAGES.attachments)}
                    <Divider />
                </DialogTitle>
                {/* setting the minWith on the DilaogContent as it won't work on Dialog */}
                <DialogContent className={classes.minModalWidth}>
                    <Box>
                        {makeFileLinks(files)}
                        {makeLinks(links)}
                        {note && (
                            <>
                                {(files?.length > 0 ||
                                    (links?.length ?? []) > 0) && (
                                    <Box mt={4}>
                                        <Divider />
                                    </Box>
                                )}
                                <Box mb={2} mt={2}>
                                    <Typography style={{ fontWeight: 'bold' }}>
                                        {formatMessage(MESSAGES.notes)}
                                    </Typography>
                                </Box>
                                <Typography
                                    variant="body2"
                                    style={{
                                        whiteSpace: 'pre-line',
                                        // @ts-ignore
                                        wordWrap: 'anywhere',
                                    }}
                                >
                                    {note}
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        {formatMessage(MESSAGES.close)}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
