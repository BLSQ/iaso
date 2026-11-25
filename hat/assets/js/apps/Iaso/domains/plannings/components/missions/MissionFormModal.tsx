import React, { ReactElement, ReactNode, useCallback } from 'react';
import Alert from '@mui/material/Alert/Alert';
import { ConfirmCancelModal, IntlMessage } from 'bluesquare-components';
import { FormikProps, FormikProvider, FormikValues } from 'formik';
import { noop } from 'lodash';
import MISSION_MESSAGES from 'Iaso/domains/missions/messages';
import { SxStyles } from 'Iaso/types/general';

const styles = {
    alert: {
        mb: 1,
    },
} satisfies SxStyles;

type Props<Values extends FormikValues> = {
    id: string;
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: string;
    confirmMessage: IntlMessage;
    // Absent while the mission is loading: the modal is shown with confirm disabled.
    formik?: FormikProps<Values>;
    info?: string;
    children?: ReactNode;
};

// Generic so each dialog keeps its own Formik values type.
export const MissionFormModal = <Values extends FormikValues>({
    id,
    isOpen,
    closeDialog,
    titleMessage,
    confirmMessage,
    formik,
    info,
    children,
}: Props<Values>): ReactElement => {
    const allowConfirm = Boolean(
        formik && formik.isValid && formik.dirty && !formik.isSubmitting,
    );
    const handleSubmit = formik?.handleSubmit;
    const handleConfirm = useCallback(() => handleSubmit?.(), [handleSubmit]);

    const modal = (
        <ConfirmCancelModal
            id={id}
            dataTestId={id}
            open={isOpen}
            closeDialog={closeDialog}
            onClose={noop}
            onCancel={noop}
            onConfirm={handleConfirm}
            closeOnConfirm={false}
            allowConfirm={allowConfirm}
            maxWidth="md"
            titleMessage={titleMessage}
            confirmMessage={confirmMessage}
            cancelMessage={MISSION_MESSAGES.cancel}
        >
            {info && (
                <Alert severity="info" sx={styles.alert}>
                    {info}
                </Alert>
            )}
            {formik?.status && (
                <Alert severity="error" sx={styles.alert}>
                    {formik.status}
                </Alert>
            )}
            {children}
        </ConfirmCancelModal>
    );

    return formik ? (
        <FormikProvider value={formik}>{modal}</FormikProvider>
    ) : (
        modal
    );
};
