import React from 'react';
import {
    Alert,
    Box,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert/Alert';
import Divider from '@mui/material/Divider';
import { visuallyHidden } from '@mui/utils';
import { Select, useSafeIntl } from 'bluesquare-components';
import { FieldArrayRenderProps } from 'formik';
import { FormikContextType, FormikProps } from 'formik/dist/types';
import {
    useGetFormsDropdownOptions,
    UseGetFormsDropdownParams,
} from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { MissionFormItem } from './MissionFormItem';

const styles: SxStyles = {
    tableContainer: {
        border: theme => `1px solid ${theme.palette.lightGray.border}`,
        borderRadius: 1,
    },
    headerCell: {
        color: 'text.primary',
        fontWeight: 500,
        py: 1.5,
    },
    numberHeaderCell: {
        color: 'text.primary',
        fontWeight: 500,
        py: 1.5,
        width: 120,
        maxWidth: 140,
        whiteSpace: 'nowrap',
    },
    actionsHeaderCell: {
        width: 56,
        py: 1.5,
    },
};

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
};

export const MissionFormsFieldArray = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
    arrayHelpers,
}: Props<TSchema>) => {
    const { values, errors, setFieldTouched } = formik;
    const { data: formsOptions, isLoading } =
        useGetFormsDropdownOptions(params);
    const { formatMessage } = useSafeIntl();
    const [selectKey, setSelectKey] = React.useState(0);

    const availableFormOptions = React.useMemo(
        () =>
            formsOptions?.filter(
                e => !values.forms.map(f => f.form).includes(e.value),
            ) ?? [],
        [formsOptions, values.forms],
    );

    const findFormOptionFromValue = React.useCallback(
        (value: number) => {
            return formsOptions?.filter(e => e.value === value)?.[0];
        },
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
            <Stack direction={'row'}>
                <Box sx={{ width: '100%' }}>
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
                </Box>
            </Stack>

            <FormArrayErrors
                errors={errors}
                sx={{ mt: 2 }}
                touched={!!arrayHelpers.form.touched.forms}
            />

            {hasForms && (
                <>
                    <Divider sx={{ my: 2 }} />
                    <TableContainer sx={styles.tableContainer}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={styles.headerCell}>
                                        {formatMessage(MESSAGES.form)}
                                    </TableCell>
                                    <TableCell sx={styles.numberHeaderCell}>
                                        {formatMessage(MESSAGES.minPerOrgUnit)}
                                    </TableCell>
                                    <TableCell sx={styles.numberHeaderCell}>
                                        {formatMessage(MESSAGES.maxPerOrgUnit)}
                                    </TableCell>
                                    <TableCell sx={styles.actionsHeaderCell}>
                                        <Box
                                            component="span"
                                            sx={visuallyHidden}
                                        >
                                            {formatMessage(MESSAGES.actions)}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
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
