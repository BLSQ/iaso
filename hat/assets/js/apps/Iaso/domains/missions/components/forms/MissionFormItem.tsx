import React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import DescriptionIcon from '@mui/icons-material/Description';
import {
    Alert,
    Box,
    IconButton,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useSafeIntl } from 'bluesquare-components';
import { ErrorMessage, Field, FieldArrayRenderProps } from 'formik';
import { FormikProps } from 'formik/dist/types';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { FormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles: SxStyles = {
    formCell: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    formIcon: {
        fontSize: '18px',
        color: 'primary.main',
    },
    formName: {
        fontWeight: 600,
    },
    numberCell: {
        width: 120,
        maxWidth: 140,
        verticalAlign: 'middle',
        position: 'relative',
        // Keep accessible names without showing labels (table headers cover that)
        '& label': visuallyHidden,
    },
    actionsCell: {
        width: 56,
        verticalAlign: 'middle',
    },
};

type Props<TSchema extends MissionCreateBody | MissionUpdateBody> = {
    form: TSchema['forms'][number];
    findFormOptionFromValue: (
        formId: number,
    ) => FormsDropdownOptions[number] | undefined;
    index: number;
    arrayHelpers: FieldArrayRenderProps;
    formik: FormikProps<TSchema>;
};

export const MissionFormItem = <
    TSchema extends MissionCreateBody | MissionUpdateBody,
>({
    form,
    findFormOptionFromValue,
    index,
    arrayHelpers,
    formik,
}: Props<TSchema>) => {
    const { formatMessage } = useSafeIntl();
    const formLabel =
        findFormOptionFromValue(form.form)?.label ?? String(form.form);
    const minLabel = formatMessage(MESSAGES.minCardinality);
    const maxLabel = formatMessage(MESSAGES.maxCardinality);

    return (
        <TableRow>
            <TableCell>
                <Box sx={styles.formCell}>
                    <DescriptionIcon sx={styles.formIcon} />
                    <Typography sx={styles.formName} variant="body2">
                        {formLabel}
                    </Typography>

                    <ErrorMessage name={`forms.[${index}].form`}>
                        {msg => (
                            <Alert severity={'error'} sx={{ mt: 1 }}>
                                {msg}
                            </Alert>
                        )}
                    </ErrorMessage>
                </Box>
            </TableCell>
            <TableCell sx={styles.numberCell}>
                <Field
                    label={minLabel}
                    name={`forms.${index}.min_cardinality`}
                    initialValue={1}
                    min={1}
                    component={NumberInput}
                    required
                    withMarginTop={false}
                />
            </TableCell>
            <TableCell sx={styles.numberCell}>
                <Field
                    label={maxLabel}
                    name={`forms.${index}.max_cardinality`}
                    initialValue={1}
                    min={0}
                    component={NumberInput}
                    withMarginTop={false}
                />
            </TableCell>
            <TableCell align="right" sx={styles.actionsCell}>
                <IconButton
                    edge="end"
                    aria-label={formatMessage(MESSAGES.delete)}
                    color="error"
                    size="small"
                    onClick={() => {
                        arrayHelpers.remove(index);
                        formik.setFieldTouched('forms', true);
                    }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </TableCell>
        </TableRow>
    );
};
