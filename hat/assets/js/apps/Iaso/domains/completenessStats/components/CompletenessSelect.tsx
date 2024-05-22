import React, { FunctionComponent, useCallback, ChangeEvent } from 'react';
import { Paper, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, useRedirectToReplace } from 'bluesquare-components';
import { CompletenessRouterParams } from '../types';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        bottom: 'auto',
        left: 'auto',
        right: theme.spacing(1),
        top: theme.spacing(1),
        width: 'auto',
        paddingLeft: theme.spacing(2),
    },
}));

type Props = {
    params: CompletenessRouterParams;
};

const baseUrl = baseUrls.completenessStats;
export const CompletenessSelect: FunctionComponent<Props> = ({ params }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const handleChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            const tempParams = {
                ...params,
                showDirectCompleteness: event.target.value,
            };
            redirectToReplace(baseUrl, tempParams);
        },
        [params, redirectToReplace],
    );

    return (
        <Paper elevation={1} className={classes.root}>
            <RadioGroup
                name="showDirectCompleteness"
                value={params.showDirectCompleteness || 'false'}
                onChange={handleChange}
            >
                <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label={formatMessage(MESSAGES.childrenCompleteness)}
                />
                <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label={formatMessage(MESSAGES.directCompleteness)}
                />
            </RadioGroup>
        </Paper>
    );
};
