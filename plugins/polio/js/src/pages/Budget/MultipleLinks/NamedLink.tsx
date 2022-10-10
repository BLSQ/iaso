import React, { FunctionComponent } from 'react';
import { Grid, makeStyles } from '@material-ui/core';
import { Field } from 'formik';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import classNames from 'classnames';
import { useStyles } from '../../../styles/theme';
import { TextInput } from '../../../components/Inputs/TextInput';
import MESSAGES from '../../../constants/messages';

const useCustomStyles = makeStyles(theme => {
    return {
        linkInput: {
            '& .MuiOutlinedInput-input': { padding: theme.spacing(1, 1, 1, 1) },
        },
    };
});
type Props = {
    index;
};

export const NamedLink: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = useStyles();
    const customStyle: Record<string, string> = useCustomStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.alias)}
                    name={`links[${index}].alias`}
                    className={classNames(classes.input, customStyle.linkInput)}
                    component={TextInput}
                />
            </Grid>
            <Grid item xs={8}>
                <Field
                    label={formatMessage(MESSAGES.url)}
                    name={`links[${index}].url`}
                    component={TextInput}
                    className={classNames(classes.input, customStyle.linkInput)}
                />
            </Grid>
        </Grid>
    );
};
