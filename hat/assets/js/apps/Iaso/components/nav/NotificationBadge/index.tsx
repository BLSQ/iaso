import React, { FunctionComponent, useRef, useState } from 'react';
import { NotificationImportant } from '@mui/icons-material';
import {
    ClickAwayListener,
    Grow,
    IconButton,
    MenuItem,
    MenuList,
    Paper,
    Popper,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useRedirectToReplace } from 'bluesquare-components';
import { useGetNotifications } from 'Iaso/components/nav/NotificationBadge/hooks/requests';
import { baseUrls } from 'Iaso/constants/urls';

const styles = theme => ({
    menuButton: {
        [theme.breakpoints.up('md')]: {
            marginRight: `${theme.spacing(2)} !important`,
            marginLeft: `${theme.spacing(1)} !important`,
        },
    },
});

const useStyles = makeStyles(styles);

export const NotificationBadge: FunctionComponent = () => {
    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const classes = useStyles();
    const { data, isFetching } = useGetNotifications();
    const redirect = useRedirectToReplace();
    if (isFetching || data?.length == 0) {
        return <></>;
    }
    const color =
        data?.find(
            notification =>
                notification.level == 'ERROR' ||
                notification.level == 'CRITICAL',
        ) != null
            ? 'error'
            : 'normal';
    return (
        <>
            <IconButton
                id="top-bar-notification-badge"
                className={classes.menuButton}
                ref={anchorRef}
                color="inherit"
                aria-label="Back"
                onClick={() => {
                    setOpen(!open);
                }}
            >
                <NotificationImportant color={color} />
            </IconButton>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                placement="bottom-start"
                transition
                disablePortal
                sx={{ zIndex: 10 }}
            >
                {({ TransitionProps }) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin: 'right bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener
                                onClickAway={() => setOpen(false)}
                            >
                                <MenuList
                                    autoFocusItem={open}
                                    id="account-menu"
                                    aria-labelledby="account-button"
                                >
                                    {data?.map(notification => (
                                        <MenuItem
                                            key={notification.type}
                                            onClick={() => {
                                                if (
                                                    notification.type ==
                                                    'APIIMPORT'
                                                ) {
                                                    redirect(
                                                        baseUrls.adminApiImport,
                                                        { hasProblem: true },
                                                    );
                                                }
                                            }}
                                        >
                                            {notification.message}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
};
