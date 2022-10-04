import React, { FunctionComponent, useCallback } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Typography,
} from '@material-ui/core';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../../constants/messages';
import { BudgetEventType } from '../../../constants/types';
import { makeFileLinks, makeLinks } from '../utils';
import { Nullable } from '../../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { useGetBudgetEventFiles } from '../../../hooks/useGetBudgetEventFiles';

type Props = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    eventId: number;
    // eslint-disable-next-line react/require-default-props
    note?: Nullable<string>;
    date: string;
    links: Nullable<string>;
    author: number;
    recipients: string;
    type: BudgetEventType;
};

export const BudgetFilesModalForCards: FunctionComponent<Props> = ({
    open,
    setOpen,
    note,
    date,
    links,
    author,
    eventId,
    recipients,
    type,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: budgetEventFiles, isFetching } =
        useGetBudgetEventFiles(eventId);
    const typeTranslated = formatMessage(MESSAGES[type]);
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
                    {formatMessage(MESSAGES.budgetFiles, {
                        type: typeTranslated,
                        date: moment(date).format('L'),
                        author,
                        recipients,
                    })}
                </DialogTitle>
                <DialogContent>
                    <Divider />
                    {isFetching && <LoadingSpinner />}
                    {!isFetching && (
                        <Box mt={2}>
                            {makeFileLinks(budgetEventFiles)}
                            {/* {makeLinks(links)} */}
                            {note && (
                                <>
                                    {(budgetEventFiles?.length > 0 ||
                                        links) && (
                                        <Box mt={4}>
                                            <Divider />
                                        </Box>
                                    )}
                                    <Box mb={2} mt={2}>
                                        <Typography
                                            style={{ fontWeight: 'bold' }}
                                        >
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
                    )}
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
