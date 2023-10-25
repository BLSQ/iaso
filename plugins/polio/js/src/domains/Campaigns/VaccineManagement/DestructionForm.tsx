import { Grid } from '@mui/material';
import { Field, useFormikContext } from 'formik';
import React, { FunctionComponent, useEffect, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { DateInput } from '../../../components/Inputs/DateInput';
import { useStyles } from '../../../styles/theme';
import { MultilineText } from '../../../components/Inputs/MultilineText';
import { DebouncedTextInput } from '../../../components/Inputs/DebouncedTextInput';

type Props = { accessor: string; index: number; roundIndex: number };

export const destructionFieldNames = [
    'date_report_received',
    'date_report',
    'vials_destroyed',
    'comment',
];

export const DestructionForm: FunctionComponent<Props> = ({
    accessor,
    index,
    roundIndex,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { values = {} as any, setFieldTouched } = useFormikContext();
    const fieldValues = useMemo(
        () => values?.rounds?.[roundIndex].destructions?.[index],
        [index, roundIndex, values?.rounds],
    );
    useEffect(() => {
        // Using every to be able to break the loop
        destructionFieldNames.every(key => {
            if (fieldValues?.[key]) {
                destructionFieldNames.forEach(name => {
                    setFieldTouched(
                        `${accessor}.destructions[${index}].${name}`,
                        true,
                    );
                });
                // break the loop if any field has a value
                return false;
            }
            return true;
        });
    }, [accessor, fieldValues, index, setFieldTouched]);

    const disableComment = !(
        values?.round?.[roundIndex]?.destructions?.[index]?.date_report &&
        values?.round?.[roundIndex]?.destructions?.[index]
            ?.date_report_received &&
        values?.round?.[roundIndex]?.destructions?.[index]?.vials_destroyed
    );

    return (
        <Grid container direction="row" spacing={2} item xs={12}>
            <Grid item xs={3}>
                <Field
                    label={formatMessage(MESSAGES.destructionReceptionDate)}
                    name={`${accessor}.destructions[${index}].date_report_received`}
                    component={DateInput}
                />
            </Grid>
            <Grid item xs={3}>
                <Field
                    label={formatMessage(MESSAGES.destructionReportDate)}
                    name={`${accessor}.destructions[${index}].date_report`}
                    component={DateInput}
                    className={classes.input}
                />
            </Grid>
            <Grid item xs={3}>
                <Field
                    label={formatMessage(MESSAGES.vialsDestroyed)}
                    name={`${accessor}.destructions[${index}].vials_destroyed`}
                    component={DebouncedTextInput}
                    debounceTime={300}
                    className={classes.input}
                />
            </Grid>
            <Grid item xs={3}>
                <Field
                    label={formatMessage(MESSAGES.comment)}
                    name={`${accessor}.destructions[${index}].comment`}
                    component={MultilineText}
                    className={classes.input}
                    debounceTime={1000}
                    disabled={disableComment}
                />
            </Grid>
        </Grid>
    );
};
