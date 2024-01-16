/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    Dispatch,
    SetStateAction,
    useMemo,
} from 'react';
import {
    useSafeIntl,
    SimpleModal,
    IconButton as IconButtonBlsq,
} from 'bluesquare-components';
import { Grid } from '@mui/material';
import MESSAGES from '../messages';
import { useGetApprovalProposal } from '../hooks/api/useGetApprovalProposal';
import { SelectedChangeRequest } from '../Tables/ReviewOrgUnitChangesTable';
import { useNewFields } from '../hooks/useNewFields';
import { ApproveOrgUnitChangesButtons } from './ReviewOrgUnitChangesButtons';
import { ChangeRequestValidationStatus } from '../types';
import { useSaveChangeRequest } from '../hooks/api/useSaveChangeRequest';
import { ReviewOrgUnitChangesDetailsTable } from '../Tables/details/ReviewOrgUnitChangesDetailsTable';
import { ReviewOrgUnitChangesInfos } from './ReviewOrgUnitChangesInfos';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    selectedChangeRequest?: SelectedChangeRequest;
};

export const ReviewOrgUnitChangesDialog: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    selectedChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(selectedChangeRequest?.id);
    const isNew: boolean =
        !isFetchingChangeRequest && changeRequest?.status === 'new';
    const { newFields, setSelected } = useNewFields(changeRequest);
    const titleMessage = useMemo(() => {
        if (changeRequest?.status === 'rejected') {
            return formatMessage(MESSAGES.seeRejectedChanges);
        }
        if (changeRequest?.status === 'approved') {
            return formatMessage(MESSAGES.seeApprovedChanges);
        }
        return formatMessage(MESSAGES.validateOrRejectChanges);
    }, [changeRequest?.status, formatMessage]);
    const { mutate: submitChangeRequest, isLoading: isSaving } =
        useSaveChangeRequest(closeDialog, selectedChangeRequest?.id);
    if (!selectedChangeRequest) return null;

    return (
        <SimpleModal
            open={isOpen}
            maxWidth="xl"
            onClose={() => null}
            id="approve-orgunit-changes-dialog"
            dataTestId="approve-orgunit-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={closeDialog}
            buttons={() =>
                isFetchingChangeRequest ? (
                    <></>
                ) : (
                    <ApproveOrgUnitChangesButtons
                        closeDialog={closeDialog}
                        newFields={newFields}
                        isNew={isNew}
                        submitChangeRequest={submitChangeRequest}
                    />
                )
            }
        >
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <ReviewOrgUnitChangesInfos
                        changeRequest={changeRequest}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                    />
                </Grid>
                <Grid item xs={9}>
                    <ReviewOrgUnitChangesDetailsTable
                        isSaving={isSaving}
                        changeRequest={changeRequest}
                        isFetchingChangeRequest={isFetchingChangeRequest}
                        newFields={newFields}
                        setSelected={setSelected}
                    />
                </Grid>
            </Grid>
        </SimpleModal>
    );
};

type PropsIcon = {
    changeRequestId: number;
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>;
    index: number;
    status: ChangeRequestValidationStatus;
};

export const IconButton: FunctionComponent<PropsIcon> = ({
    setSelectedChangeRequest,
    changeRequestId,
    index,
    status,
}) => {
    const handleClick = useCallback(() => {
        setSelectedChangeRequest({
            id: changeRequestId,
            index,
        });
    }, [changeRequestId, index, setSelectedChangeRequest]);
    let message = MESSAGES.validateOrRejectChanges;
    if (status === 'rejected') {
        message = MESSAGES.seeRejectedChanges;
    }
    if (status === 'approved') {
        message = MESSAGES.seeApprovedChanges;
    }
    return (
        <IconButtonBlsq
            onClick={handleClick}
            tooltipMessage={message}
            size="small"
            icon={status === 'new' ? 'edit' : 'remove-red-eye'}
        />
    );
};
