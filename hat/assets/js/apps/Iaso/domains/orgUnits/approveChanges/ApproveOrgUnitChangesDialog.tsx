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
    makeFullModal,
    ConfirmCancelModal,
    LoadingSpinner,
    useSafeIntl,
} from 'bluesquare-components';
import * as Yup from 'yup';

import { useFormik } from 'formik';
import { Box, IconButton } from '@material-ui/core';
import MESSAGES from './messages';
import { useGetApprovalProposal } from './hooks/api/useGetApprovalProposal';
import { SelectedChangeRequest } from './Table/ApproveOrgUnitChangesTable';

type Props = {
    titleMessage: IntlMessage;
    isOpen: boolean;
    closeDialog: () => void;
    changeRequestId?: number;
    changeRequestIndex?: number;
};

const validationSchema = Yup.object().shape({
    id: Yup.string().nullable(),
});

const ApproveOrgUnitChangesDialog: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    closeDialog,
    changeRequestId,
    changeRequestIndex,
}) => {
    const {
        values,
        // setFieldValue,
        // setFieldError,
        isValid,
        handleSubmit,
        // errors,
    } = useFormik({
        initialValues: {
            id: null,
        },
        validationSchema,
        onSubmit: () => {
            // eslint-disable-next-line no-console
            console.log(values);
        },
    });
    const { data: changeRequest, isFetching: isFetchingChangeRequest } =
        useGetApprovalProposal(changeRequestId);
    return (
        <ConfirmCancelModal
            titleMessage={titleMessage}
            onConfirm={() => handleSubmit()}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            maxWidth="xs"
            open={isOpen}
            allowConfirm={isValid}
            closeDialog={closeDialog}
            onClose={() => null}
            onCancel={() => {
                closeDialog();
            }}
            id="approve-orgunit-changes-dialog"
            dataTestId="pprove-orgunit-changes-dialog"
        >
            <Box minHeight={200}>
                INDEX: {changeRequestIndex}
                <br />
                {changeRequest?.id}
                {isFetchingChangeRequest && <LoadingSpinner absolute />}
            </Box>
        </ConfirmCancelModal>
    );
};

type PropsIcon = {
    onClick: () => void;
    changeRequestId: number;
    setSelectedChangeRequest: Dispatch<SetStateAction<SelectedChangeRequest>>;
    index: number;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({
    onClick,
    setSelectedChangeRequest,
    changeRequestId,
    index,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleClick = useCallback(() => {
        onClick();
        setSelectedChangeRequest({
            id: changeRequestId,
            index,
        });
    }, [changeRequestId, index, onClick, setSelectedChangeRequest]);
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
const modalWithIcon = makeFullModal(
    ApproveOrgUnitChangesDialog,
    EditIconButton,
);

export { modalWithIcon as ApproveOrgUnitChangesDialog };
