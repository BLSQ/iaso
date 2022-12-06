import { Grid } from '@material-ui/core';
import { Field } from 'formik';
import React, { FunctionComponent } from 'react';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../constants/messages';
import { DateInput } from '../components/Inputs/DateInput';
import { TextInput } from '../components/Inputs';
import { useStyles } from '../styles/theme';
import { MultilineText } from '../components/Inputs/MultilineText';

type Props = { accessor: string; index: number };

export const DestructionForm: FunctionComponent<Props> = ({
    accessor,
    index,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();

    return (
        <Grid container direction="row" spacing={2} item xs={12}>
            <Grid item xs={3}>
                <Field
                    label={formatMessage(MESSAGES.destructionReceptionDate)}
                    // fullWidth
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
                    component={TextInput}
                    // don't change the filed.touch value on Focus to avoid the component being in error state on first click
                    touchOnFocus={false}
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
                />
            </Grid>
        </Grid>
    );
};
