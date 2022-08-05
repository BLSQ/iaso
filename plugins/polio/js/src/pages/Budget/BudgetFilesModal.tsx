/* eslint-disable react/require-default-props */
import {
    Box,
    Button,
    DialogActions,
    Typography,
    Divider,
} from '@material-ui/core';
// @ts-ignore
import { IconButton, LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import React, { FunctionComponent, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import DialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DialogComponent';
import MESSAGES from '../../constants/messages';
import { BudgetEventType } from '../../constants/types';
import { useGetBudgetEventFiles } from '../../hooks/useGetBudgetEventFiles';
import { makeFileLinks, makeLinks } from './utils';

type Props = {
    eventId: number;
    note?: string;
    type: BudgetEventType;
    date: string;
    links: string;
    author: string;
    recipients: string;
    iconColor?: string;
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
    (disabled = false, color = 'action') =>
    ({ openDialog }) => {
        return (
            <IconButton
                color={color}
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

export const BudgetFilesModal: FunctionComponent<Props> = ({
    eventId,
    note,
    type,
    date,
    links,
    author,
    recipients = '',
    iconColor = 'action',
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: budgetEventFiles, isFetching } =
        useGetBudgetEventFiles(eventId);
    const typeTranslated = formatMessage(MESSAGES[type]);
    const titleMessage = {
        ...MESSAGES.budgetFiles,
        values: {
            type: typeTranslated,
            date: moment(date).format('L'),
            author,
            recipients,
        },
    };
    const disableTrigger = budgetEventFiles?.length === 0 && !note && !links;
    const renderTrigger = useCallback(
        () => makeRenderTrigger(disableTrigger, iconColor),
        [disableTrigger, iconColor],
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
            {!isFetching && (
                <Box mt={2}>
                    {makeFileLinks(budgetEventFiles)}
                    {makeLinks(links)}
                    {note && (
                        <>
                            {(budgetEventFiles?.length > 0 || links) && (
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
