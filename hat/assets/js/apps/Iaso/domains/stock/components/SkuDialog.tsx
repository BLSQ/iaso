import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import {
    IntlFormatMessage,
    IntlMessage,
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    InputWithInfos,
} from 'bluesquare-components';
import { FormikProps, FormikProvider, useFormik } from 'formik';
import isEqual from 'lodash/isEqual';
import * as yup from 'yup';

import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetOrgUnitTypesDropdownOptions } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesDropdownOptions';
import { useGetProjectsDropdownOptions } from 'Iaso/domains/projects/hooks/requests';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { SxStyles } from 'Iaso/types/general';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import InputComponent from '../../../components/forms/InputComponent';

import MESSAGES from '../messages';
import { StockKeepingUnitDto } from '../types/stocks';

type EmptyStockKeepingUnit = Partial<StockKeepingUnitDto>;

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: IntlMessage;
    initialData?: StockKeepingUnitDto | EmptyStockKeepingUnit;
    saveSku: (
        e: StockKeepingUnitDto | EmptyStockKeepingUnit,
        options: Record<string, () => void>,
    ) => void;
};

const styles: SxStyles = {
    inputWithInfos: {
        '& .MuiSvgIcon-root': {
            mt: 2,
        },
        '& .MuiGrid-item': {
            alignContent: 'center',
        },
        '& .MuiGrid-item > .MuiBox-root': {
            top: 'auto',
        },
    },
};

const useGetSchema = () => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(
        () =>
            yup.lazy(() =>
                yup.object().shape({
                    name: yup
                        .string()
                        .trim()
                        .required(formatMessage(MESSAGES.nameRequired)),
                    short_name: yup
                        .string()
                        .trim()
                        .required(formatMessage(MESSAGES.nameRequired)),
                    projects: yup.array().of(yup.number()),
                    org_unit_types: yup.array().of(yup.number()),
                    forms: yup.array().of(yup.number()),
                    display_unit: yup.string().trim(),
                    display_precision: yup.number(),
                }),
            ),
        [formatMessage],
    );
};

const SkuDialog: FunctionComponent<Props> = ({
    titleMessage,
    closeDialog,
    isOpen,
    initialData = {
        id: undefined,
        name: undefined,
        short_name: undefined,
        projects: undefined,
        org_unit_types: undefined,
        forms: undefined,
        display_unit: undefined,
        display_precision: undefined,
    },
    saveSku,
}) => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();

    const formik: FormikProps<StockKeepingUnitDto | EmptyStockKeepingUnit> =
        useFormik<StockKeepingUnitDto | EmptyStockKeepingUnit>({
            initialValues: initialData,
            enableReinitialize: true,
            validateOnBlur: true,
            validationSchema: useGetSchema(),
            onSubmit: values =>
                saveSku(values, {
                    onSuccess: closeDialog,
                }),
        });
    const {
        values,
        setFieldValue,
        errors,
        touched,
        setFieldTouched,
        isValid,
        handleSubmit,
        resetForm,
    } = formik;

    const precisionChoices = useMemo(() => {
        return [...Array(4).keys()].map(i => {
            let label = '1';
            if (i != 0) {
                label = '/' + 10 ** i;
            }
            return {
                label: label,
                value: 10 ** i,
            };
        });
    }, []);

    const onChange = (keyValue: string, value: any) => {
        // noinspection JSIgnoredPromiseFromCall
        setFieldTouched(keyValue, true);
        // noinspection JSIgnoredPromiseFromCall
        setFieldValue(keyValue, value);
    };

    const onListChange = (keyValue: string, value: string) => {
        onChange(keyValue, commaSeparatedIdsToArray(value));
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const { data: formsList, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions();
    const { data: orgUnitTypesList, isFetching: isFetchingOrgUnitTypes } =
        useGetOrgUnitTypesDropdownOptions();
    const { data: projectsList, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions();

    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                id="confirm-cancel-dialog"
                dataTestId=""
                allowConfirm={isValid && !isEqual(values, initialData)}
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                onCancel={() => {
                    closeDialog();
                    resetForm();
                }}
                onClose={() => null}
                closeDialog={closeDialog}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                maxWidth="sm"
                open={isOpen}
            >
                <div id="stock-keeping-unit-dialog">
                    {isOpen && (
                        <>
                            <InputComponent
                                keyValue="name"
                                onChange={onChange}
                                value={values.name}
                                errors={getErrors('name')}
                                type="text"
                                label={MESSAGES.name}
                                required
                            />
                            <InputComponent
                                keyValue="short_name"
                                onChange={onChange}
                                value={values.short_name}
                                errors={getErrors('short_name')}
                                type="text"
                                label={MESSAGES.short_name}
                                required
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={6} sm={6} md={6}>
                                    <InputComponent
                                        keyValue="display_unit"
                                        onChange={onChange}
                                        value={values.display_unit}
                                        errors={getErrors('display_unit')}
                                        type="text"
                                        label={MESSAGES.displayUnit}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={6} md={6}>
                                    <InputComponent
                                        keyValue="display_precision"
                                        onChange={onChange}
                                        value={values.display_precision}
                                        options={precisionChoices}
                                        errors={getErrors('display_precision')}
                                        type="select"
                                        label={MESSAGES.displayPrecision}
                                    />
                                </Grid>
                            </Grid>
                            <InputComponent
                                keyValue="projects"
                                onChange={onListChange}
                                value={values.projects}
                                type="select"
                                options={projectsList}
                                label={MESSAGES.projects}
                                loading={isFetchingProjects}
                                clearable
                                multi
                            />
                            <InputComponent
                                keyValue="org_unit_types"
                                onChange={onListChange}
                                value={values.org_unit_types}
                                type="select"
                                options={orgUnitTypesList}
                                label={MESSAGES.orgUnitsTypes}
                                loading={isFetchingOrgUnitTypes}
                                clearable
                                multi
                            />
                            <Box sx={styles.inputWithInfos}>
                                <InputWithInfos
                                    infos={formatMessage(
                                        MESSAGES.directStockManipulationFormsExplanation,
                                    )}
                                >
                                    <InputComponent
                                        keyValue="forms"
                                        onChange={onListChange}
                                        value={values.forms}
                                        type="select"
                                        options={formsList}
                                        label={
                                            MESSAGES.directStockManipulationForms
                                        }
                                        loading={isFetchingForms}
                                        clearable
                                        multi
                                    />
                                </InputWithInfos>
                            </Box>
                        </>
                    )}
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};
const modalWithButton = makeFullModal(SkuDialog, AddButton);
const modalWithIcon = makeFullModal(SkuDialog, EditIconButton);

export { modalWithButton as AddSkuDialog, modalWithIcon as EditSkuDialog };
