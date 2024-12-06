import React, { FunctionComponent, useState } from 'react';

import { Box, Popover, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../domains/app/components/messages';
import { getDefaultSourceVersion } from '../../../domains/dataSources/utils';
import { User } from '../../../utils/usersUtils';
import { AccountSwitch } from '../AccountSwitch';

type Props = {
    currentUser: User;
    version: string;
};

const useStyles = makeStyles(theme => ({
    popover: {
        pointerEvents: 'none',
    },
    paper: {
        padding: theme.spacing(1),
    },
    currentUserInfos: {
        display: 'block',
        textAlign: 'right',
        cursor: 'pointer',
        fontSize: 16,
        '&:hover': {
            color: theme.palette.secondary.main,
        },
    },
    popOverInfos: {
        display: 'block',
        fontSize: 12,
    },
    popOverLabel: {
        fontWeight: 'bold',
        paddingRight: '2px',
    },
}));

export const CurrentUserInfos: FunctionComponent<Props> = ({
    currentUser,
    version,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const defaultSourceVersion = getDefaultSourceVersion(currentUser);
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = event => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <Box
                className={classes.currentUserInfos}
                aria-owns={open ? 'mouse-over-popover' : undefined}
                aria-haspopup="true"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
            >
                {currentUser?.user_name}
            </Box>
            {currentUser.account && (
                <>
                    <Box sx={{ mx: 1 }}>-</Box>
                    <AccountSwitch />
                </>
            )}
            <Popover
                id="mouse-over-popover"
                className={classes.popover}
                classes={{
                    paper: classes.paper,
                }}
                open={open}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Typography component="div">
                    <div className={classes.popOverInfos}>
                        <span className={classes.popOverLabel}>
                            {formatMessage(MESSAGES.source)}:
                        </span>
                        <span>
                            {`${
                                (defaultSourceVersion.source &&
                                    defaultSourceVersion.source.name) ||
                                '-'
                            }`}
                        </span>
                    </div>

                    <div className={classes.popOverInfos}>
                        <span className={classes.popOverLabel}>
                            {formatMessage(MESSAGES.version)}:
                        </span>
                        <span>
                            {`${
                                defaultSourceVersion.version &&
                                defaultSourceVersion.version.number >= 0
                                    ? defaultSourceVersion.version.number
                                    : '-'
                            }`}
                        </span>
                    </div>

                    {version && (
                        <div className={classes.popOverInfos}>
                            <span className={classes.popOverLabel}>
                                {formatMessage(MESSAGES.iasoVersion)}:
                            </span>
                            <span>{version}</span>
                        </div>
                    )}
                </Typography>
            </Popover>
        </>
    );
};
