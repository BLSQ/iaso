import React, { FunctionComponent } from 'react';
import { Box, Divider } from '@mui/material';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import { EditIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';
import { DateInput } from '../../../../components/Inputs/DateInput';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';
import { useGetCountriesOptions } from '../../SupplyChain/hooks/api/vrf';
import { useSaveNationalLogisticsPlan } from '../hooks/api';
import { vaccineOptions, useStatusOptions } from '../hooks/options';
import MESSAGES from '../messages';
import { NationalLogisticsPlanData } from '../types';
import { useNationalLogisticsPlanSchema } from './validation';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    nationaPlanData?: NationalLogisticsPlanData;
};

const CreateEditNationalLogisticsPlanModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    nationaPlanData,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: save } = useSaveNationalLogisticsPlan();
    const schema = useNationalLogisticsPlanSchema();

    const { data: countries, isFetching: isFetchingCountries } =
        useGetCountriesOptions();
    const statusOptions = useStatusOptions();

    const formik = useFormik({
        initialValues: {
            id: nationaPlanData?.id,
            date: nationaPlanData?.date,
            status: nationaPlanData?.status,
            country_id: nationaPlanData?.country_id,
            vaccine: nationaPlanData?.vaccine,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: values => {
            save(values, {
                onSuccess: () => {
                    closeDialog();
                },
            });
        },
    });

    const isFormChanged = !isEqual(formik.values, formik.initialValues);
    const allowConfirm =
        !formik.isSubmitting && formik.isValid && isFormChanged;

    const title = nationaPlanData?.id
        ? formatMessage(MESSAGES.editNationalLogisticsPlan)
        : formatMessage(MESSAGES.addNationalLogisticsPlan);

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                open={isOpen}
                closeDialog={closeDialog}
                onClose={() => null}
                id="create-edit-country_plan"
                dataTestId="create-edit-country_plan"
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
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.country)}
                        name="country_id"
                        component={SingleSelect}
                        required
                        options={countries}
                        loading={isFetchingCountries}
                        clearable={false}
                        isSearchable={false}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.date)}
                        name="date"
                        component={DateInput}
                        required
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.status)}
                        name="status"
                        component={SingleSelect}
                        required
                        options={statusOptions}
                        clearable={false}
                        isSearchable={false}
                    />
                </Box>
                <Box mb={2}>
                    <Field
                        label={formatMessage(MESSAGES.antigen)}
                        name="vaccine"
                        component={SingleSelect}
                        required
                        options={vaccineOptions}
                        clearable={false}
                        isSearchable={false}
                    />
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithIcon = makeFullModal(
    CreateEditNationalLogisticsPlanModal,
    EditIconButton,
);
const modalWithButton = makeFullModal(
    CreateEditNationalLogisticsPlanModal,
    AddButton,
);

export { modalWithIcon as EditNationalLogisticsPlanModal };
export { modalWithButton as CreateNationalLogisticsPlanModal };
