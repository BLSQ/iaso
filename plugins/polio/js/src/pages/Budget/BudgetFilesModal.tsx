/* eslint-disable react/require-default-props */
import {
    Box,
    Button,
    DialogActions,
    Grid,
    Typography,
    Divider,
} from '@material-ui/core';
// @ts-ignore
import { IconButton, LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import React, { FunctionComponent, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';
import DialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DialogComponent';
import { fileExtensions } from '../../constants/fileExtensions';
import MESSAGES from '../../constants/messages';
import { useGetBudgetEventFiles } from '../../hooks/useGetBudgetEventFiles';

type Props = {
    eventId: number;
    note?: string;
    type: 'submission' | 'comments';
    date: string;
    links: string;
};

const CloseDialog = ({
    onCancel,
    closeDialog,
    buttonMessage = MESSAGES.close,
}) => {
    return (
        <DialogActions style={{ paddingBottom: '20px', paddingRight: '20px' }}>
            <Button
                onClick={() => onCancel(closeDialog)}
                color="primary"
                data-test="close-button"
            >
                <FormattedMessage {...buttonMessage} />
            </Button>
        </DialogActions>
    );
};

const makeRenderTrigger =
    (disabled = false) =>
    ({ openDialog }) => {
        return (
            <IconButton
                onClick={openDialog}
                dataTestId="see-files-button"
                tooltipMessage={MESSAGES.viewFiles}
                icon="remove-red-eye"
                disabled={disabled}
            />
        );
    };
const onClose = closeDialog => {
    closeDialog();
};

const extractFileName = (fileUrl: string) => {
    let trimmedLeft = '';
    let i = 0;
    // find the end of file name by searching for the extension
    while (trimmedLeft === '' && i < fileExtensions.length) {
        const currentExtension = fileExtensions[i];
        if (fileUrl.indexOf(currentExtension) !== -1) {
            trimmedLeft = `${
                fileUrl.split(currentExtension)[0]
            }${currentExtension}`;
        }
        i += 1;
    }
    // The name is the behind the last slash, so we find it by splitting
    const removedSlashes = trimmedLeft.split('/');
    return removedSlashes[removedSlashes.length - 1];
};

const makeFileLinks = files => {
    return files.map((file, index) => {
        const fileName = extractFileName(file.file) || file.file;
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${fileName}_${index}`} download href={file.file}>
                <Typography>{fileName}</Typography>
            </Link>
        );
    });
};

const makeLinks = (links: string) => {
    if (!links) return null;
    const linksArray = links.split(', ');
    return linksArray.map((link, index) => {
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${link}_${index}`} download href={link}>
                <Typography>{link}</Typography>
            </Link>
        );
    });
};

export const BudgetFilesModal: FunctionComponent<Props> = ({
    eventId,
    note,
    type,
    date,
    links,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: budgetEventFiles, isFetching } =
        useGetBudgetEventFiles(eventId);
    const typeTranslated = formatMessage(MESSAGES[type]).toLowerCase();
    const titleMessage = {
        ...MESSAGES.files,
        values: { type: typeTranslated, date: moment(date).format('LTS') },
    };
    const disableTrigger = budgetEventFiles?.length === 0 && !note && !links;
    const renderTrigger = useCallback(
        () => makeRenderTrigger(disableTrigger),
        [disableTrigger],
    );
    return (
        <DialogComponent
            dataTestId="budget-files-modal"
            id={`budget-files-modal ${eventId}`}
            renderActions={({ closeDialog }) => {
                return (
                    <CloseDialog closeDialog={closeDialog} onCancel={onClose} />
                );
            }}
            renderTrigger={renderTrigger()}
            titleMessage={titleMessage}
        >
            <Divider />
            {isFetching && <LoadingSpinner />}
            {budgetEventFiles?.length === 0 && !isFetching && (
                <Grid container item>
                    <Box mt={4}>
                        <Typography>
                            {formatMessage(MESSAGES.noFile)}
                        </Typography>
                    </Box>
                </Grid>
            )}
            {!isFetching && (
                <Box mt={2}>
                    {makeFileLinks(budgetEventFiles)}
                    {makeLinks(links)}
                    {note && (
                        <>
                            <Box mt={4}>
                                <Divider />
                            </Box>
                            <Box mb={2} mt={2}>
                                <Typography style={{ fontWeight: 'bold' }}>
                                    {formatMessage(MESSAGES.notes)}
                                </Typography>
                            </Box>
                            <Typography
                                variant="body2"
                                style={{ whiteSpace: 'pre-line' }}
                            >
                                {note}
                            </Typography>
                        </>
                    )}
                </Box>
            )}
        </DialogComponent>
    );
};
