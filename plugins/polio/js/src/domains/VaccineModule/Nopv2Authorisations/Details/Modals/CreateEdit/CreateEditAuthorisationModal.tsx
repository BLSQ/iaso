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
import { DateInput } from '../../../../../../components/Inputs/DateInput';
import { useCreateEditNopv2Authorisation } from '../../../hooks/api';
import { EditIconButton } from '../../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { useNopv2AuthorisationsSchema } from '../../../hooks/validation';
import MESSAGES from './MESSAGES';
import { NumberInput } from '../../../../../../components/Inputs/NumberInput';
import { MultilineText } from '../../../../../../components/Inputs/MultilineText';
import { SingleSelect } from '../../../../../../components/Inputs/SingleSelect';
import { useStatusOptions } from '../../../hooks/statuses';
import { AuthorisationAPIData } from '../../../types';
import { useGetCountries } from '../../../../../../hooks/useGetCountries';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    authorisationData?: AuthorisationAPIData;
    countryName?: string;
    countryId?: number;
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
    const schema = useNopv2AuthorisationsSchema();

    const { data, isFetching: isFetchingCountries } = useGetCountries();

    const countriesList = (data && data.orgUnits) || [];
    const formik = useFormik({
        initialValues: {
            expiration_date: authorisationData?.expiration_date,
            start_date: authorisationData?.start_date,
            quantity: authorisationData?.quantity,
            country: countryId,
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

    let title = authorisationData?.id
        ? `${formatMessage(MESSAGES.editAuth)}`
        : `${formatMessage(MESSAGES.addAuthorisation)}`;
    if (countryName) {
        title = `${title} - ${countryName}`;
    }
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
                {!countryId && (
                    <Box mb={2}>
                        <Field
                            label={formatMessage(MESSAGES.country)}
                            name="country"
                            component={SingleSelect}
                            fullWidth
                            clearable={false}
                            required
                            loading={isFetchingCountries}
                            options={countriesList.map(c => ({
                                label: c.name,
                                value: c.id,
                            }))}
                            withMarginTop
                        />
                    </Box>
                )}
                <Field
                    label={formatMessage(MESSAGES.vaccineAuthStartingDate)}
                    name="start_date"
                    component={DateInput}
                    fullWidth
                    clearable
                    required
                    withMarginTop
                />
                <Field
                    label={formatMessage(MESSAGES.expirationDate)}
                    name="expiration_date"
                    component={DateInput}
                    fullWidth
                    clearable
                    required
                    withMarginTop
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
