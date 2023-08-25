/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { Box, Divider } from '@material-ui/core';
import { useCurrentUser } from '../../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import { DateInput } from '../../../../../../components/Inputs/DateInput';
import { useCreateEditNopv2Authorisation } from '../../../hooks/api';
import { EditIconButton } from '../../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useNopv2AuthorisationsSchema } from '../../../hooks/validation';
import MESSAGES from './MESSAGES';
import { NumberInput } from '../../../../../../components/Inputs';
import { MultilineText } from '../../../../../../components/Inputs/MultilineText';
import { SingleSelect } from '../../../../../../components/Inputs/SingleSelect';
import { useStatusOptions } from '../../../hooks/statuses';
import { AuthorisationData } from '../../../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    authorisationData?: AuthorisationData;
    countryName: string;
    countryId: number;
};

const CreateEditAuthorisationModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    authorisationData,
    countryId,
    countryName,
}) => {
    const testId = 'delete-nopv2-auth';
    const { formatMessage } = useSafeIntl();
    const options = useStatusOptions();
    const { mutate: confirm } = useCreateEditNopv2Authorisation();
    const currentUser = useCurrentUser();
    const schema = useNopv2AuthorisationsSchema();

    const formik = useFormik({
        initialValues: {
            expiration_date: authorisationData?.expiration_date,
            quantity: authorisationData?.quantity,
            country: countryId,
            account: currentUser.account.id,
            comment: authorisationData?.comment,
            status: authorisationData?.status,
            id: authorisationData?.id,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: async values => {
            confirm(values);
        },
    });
    const isFormChanged = !isEqual(formik.values, formik.initialValues);

    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;

    const title = authorisationData?.id
        ? `${formatMessage(MESSAGES.editAuth)}`
        : `${formatMessage(MESSAGES.addAuthorisation)} - ${countryName}`;
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                open={isOpen}
                closeDialog={closeDialog}
                onClose={() => null}
                id={testId}
                dataTestId={testId}
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                onCancel={() => null}
                confirmMessage={MESSAGES.confirm}
                allowConfirm={allowConfirm}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2}>
                    <Divider />
                </Box>
                <Field
                    label={formatMessage(MESSAGES.expirationDate)}
                    name="expiration_date"
                    component={DateInput}
                    fullWidth
                    clearable
                />
                <Field
                    label={formatMessage(MESSAGES.quantity)}
                    name="quantity"
                    component={NumberInput}
                    fullWidth
                    clearable
                    withMarginTop
                />
                <Field
                    label={formatMessage(MESSAGES.status)}
                    name="status"
                    component={SingleSelect}
                    fullWidth
                    clearable={false}
                    required
                    options={options}
                    withMarginTop
                />
                <Box mt={2}>
                    <Field
                        label={formatMessage(MESSAGES.comment)}
                        name="comment"
                        component={MultilineText}
                        fullWidth
                        clearable
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithIcon = makeFullModal(
    CreateEditAuthorisationModal,
    EditIconButton,
);
const modalWithButton = makeFullModal(CreateEditAuthorisationModal, AddButton);

export { modalWithIcon as EditAuthorisationModal };
export { modalWithButton as CreateAuthorisationModal };
