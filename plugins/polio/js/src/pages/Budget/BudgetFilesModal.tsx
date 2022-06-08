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
import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router';
import DialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DialogComponent';
import MESSAGES from '../../constants/messages';
import { useGetBudgetEventFiles } from '../../hooks/useGetBudgetEventFiles';

type Props = {
    eventId: number;
    note?: string;
    type: 'submission' | 'comments';
    date: string;
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

const renderTrigger =
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

const makeLinks = files => {
    return files.map((file, index) => {
        const fileName = file.file.split('/media/')[1] ?? `file_${index}`;
        return (
            // eslint-disable-next-line react/no-array-index-key
            <Link key={`${fileName}_${index}`} download href={file.file}>
                <Typography
                    style={{ fontWeight: 'bold', textDecoration: 'none' }}
                >
                    {fileName}
                </Typography>
            </Link>
        );
    });
};

export const BudgetFilesModal: FunctionComponent<Props> = ({
    eventId,
    note,
    type,
    date,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: budgetEventFiles, isFetching } =
        useGetBudgetEventFiles(eventId);
    const typeTranslated = formatMessage(MESSAGES[type]).toLowerCase();
    const titleMessage = {
        ...MESSAGES.files,
        values: { type: typeTranslated, date: moment(date).format('LTS') },
    };
    return (
        <DialogComponent
            dataTestId="budget-files-modal"
            id="budget-files-modal"
            renderActions={({ closeDialog }) => {
                return (
                    <CloseDialog closeDialog={closeDialog} onCancel={onClose} />
                );
            }}
            renderTrigger={renderTrigger(!(budgetEventFiles?.length > 0))}
            titleMessage={titleMessage}
        >
            <Divider />
            {isFetching && <LoadingSpinner />}
            {!isFetching && (
                <Box mt={2}>
                    {makeLinks(budgetEventFiles)}
                    {note && (
                        <>
                            <Box mt={4}>
                                <Divider />
                            </Box>
                            <Box mb={2} mt={2}>
                                <Typography>
                                    {formatMessage(MESSAGES.notes)}
                                </Typography>
                            </Box>
                            <Typography variant="body2">{note}</Typography>
                        </>
                    )}
                    {budgetEventFiles?.length === 0 && (
                        <Grid container item>
                            <Typography>
                                {formatMessage(MESSAGES.noFile)}
                            </Typography>
                        </Grid>
                    )}
                </Box>
            )}
        </DialogComponent>
    );
};
