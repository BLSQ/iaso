import React, { FunctionComponent } from 'react';
import {
    AddButton,
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import { Box } from '@mui/material';
import { SingleSelect } from '../../../../components/Inputs/SingleSelect';
import MESSAGES from '../messages';
import { useSaveVaccineStock } from '../hooks/api';
import { useGetCountriesOptions } from '../../SupplyChain/hooks/api/vrf';
import { defaultVaccineOptions } from '../../SupplyChain/constants';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
};

const CreateVaccineStock: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: save } = useSaveVaccineStock();
    // const validationSchema = useVaccineStockValidation();
    const { data: countriesOptions, isFetching: isFetchingCountries } =
        useGetCountriesOptions();

    const formik = useFormik<any>({
        initialValues: {
            country: undefined,
            vaccine: undefined,
        },
        onSubmit: values => save(values),
        // validationSchema,
    });
    const title = formatMessage(MESSAGES.create);
    const allowConfirm = formik.isValid && !isEqual(formik.touched, {});

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                titleMessage={title}
                onConfirm={() => formik.handleSubmit()}
                allowConfirm={allowConfirm}
                open={isOpen}
                closeDialog={closeDialog}
                id="vaccine-stock-modal"
                dataTestId="vaccine-stock-modal"
                onCancel={() => null}
                onClose={() => {
                    closeDialog();
                }}
                confirmMessage={MESSAGES.save}
                cancelMessage={MESSAGES.cancel}
            >
                <Box mb={2} mt={2}>
                    <Field
                        label={formatMessage(MESSAGES.country)}
                        name="country"
                        component={SingleSelect}
                        required
                        options={countriesOptions}
                        withMarginTop
                        isLoading={isFetchingCountries}
                    />
                </Box>
                <Field
                    label={formatMessage(MESSAGES.vaccine)}
                    name="vaccine"
                    component={SingleSelect}
                    required
                    options={defaultVaccineOptions}
                    withMarginTop
                    // isLoading={isFetchingCountries}
                />
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(CreateVaccineStock, AddButton);

export { modalWithButton as CreateVaccineStock };
