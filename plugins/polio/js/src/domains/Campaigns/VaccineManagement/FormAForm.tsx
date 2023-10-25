import React, { FunctionComponent, useEffect, useMemo } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Field, useFormikContext } from 'formik';
import { Grid } from '@mui/material';
import MESSAGES from '../../../constants/messages';
import { DateInput } from '../../../components/Inputs';
import { useStyles } from '../../../styles/theme';
import { MultilineText } from '../../../components/Inputs/MultilineText';
import { DebouncedTextInput } from '../../../components/Inputs/DebouncedTextInput';

type Props = { accessor: string; roundIndex: number };

export const formAFieldNames = [
    'forma_unusable_vials',
    'forma_missing_vials',
    'forma_reception',
    'forma_usable_vials',
    'forma_date',
    'forma_comment',
];

export const FormAForm: FunctionComponent<Props> = ({
    accessor,
    roundIndex,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const {
        values = {} as any,
        setFieldTouched,
        setFieldValue,
    } = useFormikContext();
    const fieldValues = useMemo(
        () => values?.rounds[roundIndex],
        [roundIndex, values?.rounds],
    );

    // // Make all fields error by setting touched to true if any other formA field has a value
    useEffect(() => {
        // Using every to be able to break the loop
        formAFieldNames.every(key => {
            if (fieldValues?.[key]) {
                formAFieldNames.forEach(name => {
                    setFieldTouched(`${accessor}.${name}`, true);
                });
                // break the loop if any field has a value
                return false;
            }
            return true;
        });
    }, [accessor, fieldValues, setFieldTouched]);

    // // Remove error state if no field has value
    useEffect(() => {
        const isFormAEmpty = formAFieldNames.every(key => !fieldValues?.[key]);
        if (isFormAEmpty) {
            formAFieldNames.forEach(key => {
                setFieldTouched(`${accessor}.${key}`, false);
            });
        }
    }, [accessor, fieldValues, setFieldTouched]);

    // // Set TextFields values to null if empty to avoid 400.
    useEffect(() => {
        if (fieldValues?.forma_usable_vials === '') {
            setFieldValue(`${accessor}.forma_usable_vials`, null);
        }
        if (fieldValues?.forma_unusable_vials === '') {
            setFieldValue(`${accessor}.forma_unusable_vials`, null);
        }
        if (fieldValues?.forma_missing_vials === '') {
            setFieldValue(`${accessor}.forma_missing_vials`, null);
        }
    }, [
        accessor,
        fieldValues?.forma_missing_vials,
        fieldValues?.forma_unusable_vials,
        fieldValues?.forma_usable_vials,
        setFieldValue,
    ]);

    const disableComment = !(
        fieldValues?.forma_missing_vials &&
        fieldValues?.forma_unusable_vials &&
        fieldValues?.forma_usable_vials &&
        fieldValues?.forma_date &&
        fieldValues?.forma_reception
    );

    return (
        <>
            <Grid container direction="row" item xs={12} spacing={2}>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formAReception)}
                        name={`${accessor}.forma_reception`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formADate)}
                        name={`${accessor}.forma_date`}
                        component={DateInput}
                        className={classes.input}
                    />
                </Grid>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formAUnusableVials)}
                        name={`${accessor}.forma_unusable_vials`}
                        component={DebouncedTextInput}
                        debounceTime={300}
                        className={classes.input}
                    />
                </Grid>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formAMissingVials)}
                        name={`${accessor}.forma_missing_vials`}
                        component={DebouncedTextInput}
                        debounceTime={300}
                        className={classes.input}
                    />
                </Grid>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formAUsableVials)}
                        name={`${accessor}.forma_usable_vials`}
                        component={DebouncedTextInput}
                        debounceTime={300}
                        className={classes.input}
                    />
                </Grid>
                <Grid item lg={3} md={6}>
                    <Field
                        label={formatMessage(MESSAGES.formAComment)}
                        name={`${accessor}.forma_comment`}
                        component={MultilineText}
                        className={classes.input}
                        debounceTime={1000}
                        disabled={disableComment}
                    />
                </Grid>
            </Grid>
        </>
    );
};
