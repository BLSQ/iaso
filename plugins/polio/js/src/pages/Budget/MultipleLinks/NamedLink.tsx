import React, { FunctionComponent, useCallback } from 'react';
import { Grid, makeStyles, IconButton } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import ClearIcon from '@material-ui/icons/Clear';
import classNames from 'classnames';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

import { useStyles } from '../../../styles/theme';
import { TextInput } from '../../../components/Inputs/TextInput';
import MESSAGES from '../../../constants/messages';

const useCustomStyles = makeStyles(theme => {
    return {
        linkInput: {
            '& .MuiOutlinedInput-input': {
                padding: theme.spacing(1, 1, 1, 1),
            },
            marginTop: theme.spacing(1),
        },
    };
});
type Props = {
    index;
};

export const NamedLink: FunctionComponent<Props> = ({ index }) => {
    const classes: Record<string, string> = useStyles();
    const customStyle: Record<string, string> = useCustomStyles();
    const { setFieldValue, values } = useFormikContext();
    // @ts-ignore
    const { links } = values;
    const { formatMessage } = useSafeIntl();
    const handleRemoveSelf = useCallback(() => {
        if ((links ?? []).length > 1) {
            const updatedLinks = [...links];
            updatedLinks.splice(index, 1);
            setFieldValue('links', updatedLinks);
        }
        if ((links ?? []).length === 1) {
            const updatedLinks = [];
            setFieldValue('links', updatedLinks);
        }
    }, [index, links, setFieldValue]);

    return (
        <Grid container spacing={2}>
            <Grid item xs={4}>
                <Field
                    label={formatMessage(MESSAGES.displayedName)}
                    name={`links[${index}].alias`}
                    className={classNames(classes.input, customStyle.linkInput)}
                    component={TextInput}
                />
            </Grid>
            <Grid item xs={5} lg={6}>
                <Field
                    label={formatMessage(MESSAGES.url)}
                    name={`links[${index}].url`}
                    component={TextInput}
                    className={classNames(classes.input, customStyle.linkInput)}
                />
            </Grid>
            <Grid container item xs={3} lg={2} direction="row" spacing={2}>
                <Grid item xs={6}>
                    <IconButtonComponent
                        overrideIcon={ClearIcon}
                        onClick={handleRemoveSelf}
                        variant="outlined"
                        tooltipMessage={MESSAGES.delete}
                    />
                </Grid>
                <Grid item xs={6}>
                    <IconButton
                        target="_blank"
                        variant="outlined"
                        // @ts-ignore
                        href={links?.[index]?.url ?? ''}
                        // @ts-ignore
                        color="action"
                        disabled={!links?.[index]?.url}
                    >
                        <OpenInNewIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Grid>
    );
};
