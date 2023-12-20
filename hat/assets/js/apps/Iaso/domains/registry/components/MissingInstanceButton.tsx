import React, { FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSafeIntl } from 'bluesquare-components';
import { Button, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { RegistryDetailParams } from '../types';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { redirectToReplace } from '../../../routing/actions';

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
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const handleClick = useCallback(() => {
        dispatch(
            redirectToReplace(baseUrls.registryDetail, {
                ...params,
                missingSubmissionVisible: true,
            }),
        );
        onClick();
    }, [dispatch, onClick, params]);
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
