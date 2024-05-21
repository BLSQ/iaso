import React, { FunctionComponent, useCallback } from 'react';
import { useSafeIntl, useRedirectToReplace } from 'bluesquare-components';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Button, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { RegistryDetailParams } from '../types';
import { baseUrls } from '../../../constants/urls';
import MESSAGES from '../messages';

type Props = {
    params: RegistryDetailParams;
    count: number;
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
    count,
    onClick,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const redirectToReplace = useRedirectToReplace();
    const handleClick = useCallback(() => {
        redirectToReplace(baseUrls.registry, {
            ...params,
            missingSubmissionVisible: `true`,
        });
        onClick();
    }, [onClick, params, redirectToReplace]);
    return (
        <Tooltip
            arrow
            title={formatMessage(MESSAGES.missingSubmissionCount, {
                count,
            })}
        >
            <Button
                onClick={handleClick}
                variant="contained"
                className={classes.button}
            >
                <VisibilityIcon />
                {formatMessage(MESSAGES.missingSubmission)}
            </Button>
        </Tooltip>
    );
};
