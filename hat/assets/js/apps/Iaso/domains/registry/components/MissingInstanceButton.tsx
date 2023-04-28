import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Button, Tooltip, makeStyles } from '@material-ui/core';
import VisibilityIcon from '@material-ui/icons/Visibility';

import { OrgUnit } from '../../orgUnits/types/orgUnit';

import MESSAGES from '../messages';

type Props = {
    missingOrgUnits: OrgUnit[];
    onClick: () => void;
};
const useStyles = makeStyles(theme => ({
    button: {
        display: 'flex',
        alignItems: 'center',
        color: 'white',
        backgroundColor: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        '&:hover': {
            backgroundColor: theme.palette.error.dark,
            borderColor: theme.palette.error.dark,
        },
        '&:active': {
            backgroundColor: theme.palette.error.main,
            borderColor: theme.palette.error.main,
        },
        '& svg': {
            marginRight: theme.spacing(1),
        },
    },
}));

export const MissingInstanceButton: FunctionComponent<Props> = ({
    missingOrgUnits,
    onClick,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Tooltip
            arrow
            title={formatMessage(MESSAGES.missingSubmissionCount, {
                count: missingOrgUnits.length,
            })}
        >
            <Button
                onClick={onClick}
                variant="contained"
                className={classes.button}
            >
                <VisibilityIcon />
                {formatMessage(MESSAGES.missingSubmission)}
            </Button>
        </Tooltip>
    );
};
