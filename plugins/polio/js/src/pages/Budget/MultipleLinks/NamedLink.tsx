import React, { FunctionComponent } from 'react';
import { Grid } from '@material-ui/core';
import { Field } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../../../styles/theme';
import { TextInput } from '../../../components/Inputs/TextInput';
import MESSAGES from '../../../constants/messages';

type Props = {
    index;
};

export const NamedLink: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Grid container item xs={12} spacing={2}>
                <Grid item xs={6}>
                    <Field
                        label={formatMessage(MESSAGES.alias)}
                        name={`links[${index}].alias`}
                        className={classes.input}
                        component={TextInput}
                    />
                </Grid>
                <Grid item xs={6}>
                    <Field
                        label={formatMessage(MESSAGES.url)}
                        name={`links[${index}].url`}
                        component={TextInput}
                        className={classes.input}
                    />
                </Grid>
            </Grid>
        </>
    );
};
