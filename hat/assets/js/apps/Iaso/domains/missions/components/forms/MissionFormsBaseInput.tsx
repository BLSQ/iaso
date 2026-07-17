import React from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
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
    Typography,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert/Alert';
import Divider from '@mui/material/Divider';
import { visuallyHidden } from '@mui/utils';
import { Select, useSafeIntl } from 'bluesquare-components';
import { FieldArray } from 'formik';
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
        border: theme =>
            // @ts-ignore — ligthGray typo is in the theme
            `1px solid ${theme.palette.ligthGray.border}`,
        borderRadius: 1,
    },
    headerCell: {
        color: 'text.secondary',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        py: 1.5,
    },
    numberHeaderCell: {
        color: 'text.secondary',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        py: 1.5,
        width: 120,
        maxWidth: 140,
    },
    actionsHeaderCell: {
        width: 56,
        py: 1.5,
    },
};

type MissionFormsInput<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
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

export const MissionFormsBaseInput = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    params,
    formik,
    formSelectProps,
}: MissionFormsInput<TSchema>) => {
    const { values, errors } = formik;
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

    const hasForms = Boolean(values.forms?.length);

    return (
        <>
            <Typography
                variant="body1"
                sx={{
                    textTransform: 'uppercase',
                    mb: 2,
                    fontSize: '15px',
                    mt: 4,
                }}
            >
                <DescriptionIcon
                    color="primary"
                    sx={{
                        mr: 1,
                        fontSize: '15px',
                        position: 'relative',
                        top: '2px',
                    }}
                />
                {formatMessage(MESSAGES.forms)}
            </Typography>
            <FieldArray
                name="forms"
                render={arrayHelpers => {
                    // TODO: This should be part of another component
                    const handleAddForm = (formOptionValue: number | null) => {
                        if (formOptionValue == null) {
                            return;
                        }
                        arrayHelpers.push({
                            form: formOptionValue,
                            min_cardinality: 1,
                            max_cardinality: null,
                        });
                        formik.setFieldTouched('forms', true);
                        // Remount Select so Autocomplete clears its input immediately
                        // (value={null} alone keeps the label until blur)
                        setSelectKey(key => key + 1);
                    };
                    return (
                        <Box sx={{ mt: 2 }}>
                            <Typography
                                component="p"
                                sx={{
                                    fontSize: '12px',
                                    pl: 1,
                                    pr: 2,
                                    mb: 1,
                                }}
                            >
                                {formatMessage(MESSAGES.formInfo)}
                            </Typography>
                            <Stack direction={'row'}>
                                <Box sx={{ width: '100%' }}>
                                    <Select
                                        key={selectKey}
                                        loading={isLoading}
                                        options={availableFormOptions}
                                        label={formatMessage(MESSAGES.addForm)}
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
                                                    <TableCell
                                                        sx={styles.headerCell}
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.form,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={
                                                            styles.numberHeaderCell
                                                        }
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.min,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={
                                                            styles.numberHeaderCell
                                                        }
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.max,
                                                        )}
                                                    </TableCell>
                                                    <TableCell
                                                        sx={
                                                            styles.actionsHeaderCell
                                                        }
                                                    >
                                                        <Box
                                                            component="span"
                                                            sx={visuallyHidden}
                                                        >
                                                            {formatMessage(
                                                                MESSAGES.actions,
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {values.forms?.map(
                                                    (form, index) => (
                                                        <MissionFormItem
                                                            // as we cannot be sure that form.form will be unique, it's ok to silence it there
                                                            // eslint-disable-next-line react/no-array-index-key
                                                            key={`forms-${form.form}-${index}`}
                                                            form={form}
                                                            findFormOptionFromValue={
                                                                findFormOptionFromValue
                                                            }
                                                            index={index}
                                                            arrayHelpers={
                                                                arrayHelpers
                                                            }
                                                            formik={formik}
                                                        />
                                                    ),
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </>
                            )}
                        </Box>
                    );
                }}
            />
        </>
    );
};
