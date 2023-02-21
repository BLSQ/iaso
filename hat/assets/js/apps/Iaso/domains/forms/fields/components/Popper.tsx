import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { Box, Typography, Link } from '@material-ui/core';

import { iasoFields, xlsQuestionsTypesLink } from '../constants';
import { MESSAGES } from '../messages';

import { InfoPopper } from '../../../app/components/InfoPopper';

const useStyles = makeStyles((theme: Theme) => ({
    subtitle1: {
        paddingRight: theme.spacing(2),
    },
}));

export const Popper: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const activeFields: string = iasoFields
        .filter(iasoField => !iasoField.disabled)
        .map(iasoField => iasoField.type)
        .join(', ');

    return (
        <InfoPopper>
            <Typography variant="subtitle1" className={classes.subtitle1}>
                {formatMessage(MESSAGES.supportedTypeFields)}:
            </Typography>
            <Box mb={1}>{activeFields}</Box>
            <Link target="_blank" href={xlsQuestionsTypesLink}>
                {formatMessage(MESSAGES.xlsQuestionsTypesLink)}
            </Link>
        </InfoPopper>
    );
};
