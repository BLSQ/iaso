import React from 'react';
import { Alert, Box, Table, TableBody, TableContainer } from '@mui/material';
import { AlertProps } from '@mui/material/Alert/Alert';
import Divider from '@mui/material/Divider';
import { Select, useSafeIntl } from 'bluesquare-components';
import { FieldArrayRenderProps } from 'formik';
import { FormikContextType, FormikProps } from 'formik/dist/types';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import {
    useGetFormsDropdownOptions,
    UseGetFormsDropdownParams,
} from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { FORMS_SECTION_MESSAGES } from '../missionTypeOptions';
import { missionStyles } from '../styles';

const styles: SxStyles = {
    errors: { mt: 2 },
    divider: { my: 2 },
};
import { MissionFormItem } from './MissionFormItem';
import { MissionFormsTableHead } from './MissionFormsTableHead';

type FormArrayErrorsProps<TSchema> = {
    errors: FormikContextType<TSchema>['errors'];
    touched: boolean;
} & Omit<AlertProps, 'severity'>;

const FormArrayErrors = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    errors,
    touched,
    ...props
}: FormArrayErrorsProps<TSchema>) => {
    return typeof errors.forms === 'string' && touched ? (
        <Alert severity={'error'} {...props}>
            {errors.forms}
        </Alert>
    ) : null;
};

type Props<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
    arrayHelpers: FieldArrayRenderProps;
    missionType: MissionTypeDa2Enum;
};

export const MissionFormsFieldArray = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
    arrayHelpers,
    missionType,
}: Props<TSchema>) => {
    const { values, errors, setFieldTouched } = formik;
    const { data: formsOptions, isLoading } =
        useGetFormsDropdownOptions(params);
    const { formatMessage } = useSafeIntl();
    const { minColumn, maxColumn } = FORMS_SECTION_MESSAGES[missionType];
    const [selectKey, setSelectKey] = React.useState(0);

    const availableFormOptions = React.useMemo(() => {
        const selectedFormIds = new Set(values.forms.map(f => f.form));
        return formsOptions?.filter(e => !selectedFormIds.has(e.value)) ?? [];
    }, [formsOptions, values.forms]);

    const findFormOptionFromValue = React.useCallback(
        (value: number) => formsOptions?.find(e => e.value === value),
        [formsOptions],
    );

    const handleAddForm = React.useCallback(
        (formOptionValue: number | null) => {
            if (formOptionValue == null) {
                return;
            }
            arrayHelpers.push({
                form: formOptionValue,
                min_cardinality: 1,
                max_cardinality: null,
            });
            setFieldTouched('forms', true);
            // Remount Select so Autocomplete clears its input immediately
            // (value={null} alone keeps the label until blur)
            setSelectKey(key => key + 1);
        },
        [arrayHelpers, setFieldTouched],
    );

    const hasForms = Boolean(values.forms?.length);

    return (
        <Box>
            <Select
                key={selectKey}
                loading={isLoading}
                options={availableFormOptions}
                label={formatMessage(MESSAGES.addFormLabel)}
                placeholder={formatMessage(MESSAGES.addForm)}
                clearable
                value={null}
                keyValue={'add_form'}
                onChange={handleAddForm}
                {...formSelectProps}
            />

            <FormArrayErrors
                errors={errors}
                sx={styles.errors}
                touched={!!arrayHelpers.form.touched.forms}
            />

            {hasForms && (
                <>
                    <Divider sx={styles.divider} />
                    <TableContainer sx={missionStyles.bordered}>
                        <Table size="small">
                            <MissionFormsTableHead
                                minLabel={formatMessage(minColumn)}
                                maxLabel={formatMessage(maxColumn)}
                                withActions
                            />
                            <TableBody>
                                {React.Children.toArray(
                                    values.forms?.map((form, index) => (
                                        <MissionFormItem
                                            form={form}
                                            findFormOptionFromValue={
                                                findFormOptionFromValue
                                            }
                                            index={index}
                                            arrayHelpers={arrayHelpers}
                                            formik={formik}
                                        />
                                    )),
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};
