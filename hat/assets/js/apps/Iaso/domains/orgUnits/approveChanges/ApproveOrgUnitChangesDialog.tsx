/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    Dispatch,
    SetStateAction,
} from 'react';
import SettingsIcon from '@material-ui/icons/Settings';
import {
    IntlMessage,
    LoadingSpinner,
    useSafeIntl,
    SimpleModal,
} from 'bluesquare-components';
import { Box, Button, IconButton } from '@material-ui/core';
import MESSAGES from './messages';
import { useGetApprovalProposal } from './hooks/api/useGetApprovalProposal';
import { SelectedChangeRequest } from './Table/ApproveOrgUnitChangesTable';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    selectedChangeRequest?: SelectedChangeRequest;
};

export const ApproveOrgUnitChangesDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    selectedChangeRequest,
}) => {
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(selectedChangeRequest?.id);
    return (
        <SimpleModal
            open={isOpen}
            maxWidth="xs"
            onClose={() => null}
            id="approve-orgunit-changes-dialog"
            dataTestId="pprove-orgunit-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            buttons={() => (
                <>
                    <Button
                        onClick={() => {
                            closeDialog();
                        }}
                        color="primary"
                        data-test="cancel-button"
                    >
                        CANCEL
                    </Button>
                    <Button
                        data-test="confirm-button"
                        onClick={() => {
                            console.log('SUBMIT');
                        }}
                        disabled={false}
                        color="primary"
                        autoFocus
                    >
                        CONFIRM
                    </Button>
                </>
            )}
        >
            <Box minHeight={200}>
                INDEX: {selectedChangeRequest?.index}
                <br />
                {changeRequest?.id}
                {isFetchingChangeRequest && <LoadingSpinner absolute />}
            </Box>
        </SimpleModal>
    );
};

type PropsIcon = {
    changeRequestId: number;
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>;
    index: number;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({
    setSelectedChangeRequest,
    changeRequestId,
    index,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        setSelectedChangeRequest({
            id: changeRequestId,
            index,
        });
    }, [changeRequestId, index, setSelectedChangeRequest]);
    return (
        <IconButton
            onClick={handleClick}
            aria-label={formatMessage(MESSAGES.edit)}
            size="small"
        >
            <SettingsIcon />
        </IconButton>
    );
};
