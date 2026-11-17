import React, { FC } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { FormHelperText, IconButton, TableCell, TableRow } from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { useSafeIntl } from 'bluesquare-components';
import { Field, FieldArrayRenderProps, useFormikContext } from 'formik';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { FormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { MissionCreateBody } from 'Iaso/domains/missions/schemas/create';
import { MissionUpdateBody } from 'Iaso/domains/missions/types';
import { useTranslatedErrors } from 'Iaso/libs/validation';
import { SxStyles } from 'Iaso/types/general';
import { CARDINALITY_INPUT_OPTIONS, INFINITY_SYMBOL } from '../../constants';
import MESSAGES from '../../messages';
import { MissionFormName } from './MissionFormName';

const COLUMNS_COUNT = 4;

const styles = {
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
    cellAboveErrors: {
        borderBottom: 'none',
    },
    errorsCell: {
        pt: 0,
    },
} satisfies SxStyles;

const numberInputOptions = {
    ...CARDINALITY_INPUT_OPTIONS,
    size: 'small',
    // Errors are displayed in a full-width row below, narrow cells would wrap them
    hideError: true,
} as const;

const ROW_FIELDS = ['form', 'min_cardinality', 'max_cardinality'] as const;

type MissionBody = MissionCreateBody | MissionUpdateBody;

type Props = {
    form: MissionBody['forms'][number];
    findFormOptionFromValue: (
        formId: number,
    ) => FormsDropdownOptions[number] | undefined;
    index: number;
    arrayHelpers: FieldArrayRenderProps;
};

export const MissionFormItem: FC<Props> = ({
    form,
    findFormOptionFromValue,
    index,
    arrayHelpers,
}) => {
    const formik = useFormikContext<MissionBody>();
    const { formatMessage } = useSafeIntl();
    const formLabel =
        findFormOptionFromValue(form.form)?.label ?? String(form.form);
    const minLabel = formatMessage(MESSAGES.minCardinality);
    const maxLabel = formatMessage(MESSAGES.maxCardinality);
    const getErrors = useTranslatedErrors({
        formatMessage,
        touched: formik.touched,
        errors: formik.errors,
        messages: MESSAGES,
    });
    // min and max can share the same cross-field error
    const rowErrors = [
        ...new Set(
            ROW_FIELDS.flatMap(field => getErrors(`forms.${index}.${field}`)),
        ),
    ];
    const hasRowErrors = rowErrors.length > 0;
    const rowCellSx = hasRowErrors ? styles.cellAboveErrors : {};

    return (
        <>
            <TableRow>
                <TableCell sx={rowCellSx}>
                    <MissionFormName name={formLabel} />
                </TableCell>
                <TableCell sx={{ ...styles.numberCell, ...rowCellSx }}>
                    <Field
                        label={minLabel}
                        name={`forms.${index}.min_cardinality`}
                        initialValue={1}
                        min={1}
                        component={NumberInput}
                        required
                        withMarginTop={false}
                        numberInputOptions={numberInputOptions}
                    />
                </TableCell>
                <TableCell sx={{ ...styles.numberCell, ...rowCellSx }}>
                    <Field
                        label={maxLabel}
                        name={`forms.${index}.max_cardinality`}
                        initialValue={1}
                        min={0}
                        placeholder={INFINITY_SYMBOL}
                        component={NumberInput}
                        withMarginTop={false}
                        numberInputOptions={numberInputOptions}
                    />
                </TableCell>
                <TableCell
                    align="right"
                    sx={{ ...styles.actionsCell, ...rowCellSx }}
                >
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
            {hasRowErrors && (
                <TableRow>
                    <TableCell colSpan={COLUMNS_COUNT} sx={styles.errorsCell}>
                        {React.Children.toArray(
                            rowErrors.map(error => (
                                <FormHelperText error>{error}</FormHelperText>
                            )),
                        )}
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};
