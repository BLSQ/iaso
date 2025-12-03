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
import { useSavePerformance } from '../hooks/api';
import { useVaccineOptions, useStatusOptions } from '../hooks/options';
import MESSAGES from '../messages';
import { PerformanceData } from '../types';
import { usePerformanceDashboardSchema } from './validation';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    performanceData?: PerformanceData;
};

const CreateEditPerformanceModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    performanceData,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: save } = useSavePerformance();
    const schema = usePerformanceDashboardSchema();

    const { data: countries, isFetching: isFetchingCountries } =
        useGetCountriesOptions();
    const statusOptions = useStatusOptions();
    const vaccineOptions = useVaccineOptions();

    const formik = useFormik({
        initialValues: {
            id: performanceData?.id,
            date: performanceData?.date,
            status: performanceData?.status,
            country_id: performanceData?.country_id,
            vaccine: performanceData?.vaccine,
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

    const title = performanceData?.id
        ? formatMessage(MESSAGES.editPerformance)
        : formatMessage(MESSAGES.addPerformance);

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                open={isOpen}
                closeDialog={closeDialog}
                onClose={() => null}
                id="create-edit-performance"
                dataTestId="create-edit-performance"
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

const modalWithIcon = makeFullModal(CreateEditPerformanceModal, EditIconButton);
const modalWithButton = makeFullModal(CreateEditPerformanceModal, AddButton);

export { modalWithIcon as EditPerformanceModal };
export { modalWithButton as CreatePerformanceModal };
