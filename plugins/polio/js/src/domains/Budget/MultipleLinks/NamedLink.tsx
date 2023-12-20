import React, { FunctionComponent, useCallback } from 'react';
import { Grid, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Field, useFormikContext } from 'formik';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import ClearIcon from '@mui/icons-material/Clear';
import classNames from 'classnames';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
                {/* IconButton from blsq-comp with url prop doesn't seem to work, so we're using the one from Material UI instead (cf Preparedness) */}
                <Grid item xs={6}>
                    {/* TS complains about target and href props which are passed by IconButton to its rroot element (BaseButton) */}
                    {/* @ts-ignore */}
                    <IconButton
                        target="_blank"
                        variant="outlined"
                        href={links?.[index]?.url ?? ''}
                        color="default"
                        disabled={!links?.[index]?.url}
                    >
                        <OpenInNewIcon />
                    </IconButton>
                </Grid>
            </Grid>
        </Grid>
    );
};
