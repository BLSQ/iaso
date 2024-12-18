import {
    ClickAwayListener,
    Grow,
    MenuItem,
    MenuList,
    Paper,
    Popper,
    Typography,
} from '@mui/material';
import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { useSwitchAccount } from '../../hooks/useSwitchAccount';
import { useCurrentUser } from '../../utils/usersUtils';

type Props = {
    color?: 'inherit' | 'primary' | 'secondary';
};

export const AccountSwitch: FunctionComponent<Props> = ({
    color = 'inherit',
}) => {
    const currentUser = useCurrentUser();

    const [open, setOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

    const { mutateAsync: switchAccount } = useSwitchAccount(() => {
        setOpen(false);
        window.location.href = '/';
    });

    const handleToggle = () => {
        setOpen(prevOpen => !prevOpen);
    };

    const handleClose = (event: Event | React.SyntheticEvent) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }
        setOpen(false);
    };

    function handleListKeyDown(event: React.KeyboardEvent) {
        if (event.key === 'Tab') {
            event.preventDefault();
            setOpen(false);
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    }

    // Return focus to the button when we transitioned from !open -> open
    const prevOpen = useRef(open);
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current?.focus();
        }
        prevOpen.current = open;
    }, [open]);
    const menuListKeyDownHandler = React.useCallback(handleListKeyDown, []);
    if (currentUser.other_accounts?.length === 0) {
        return (
            <Typography
                variant="body2"
                color={color}
                sx={{
                    padding: theme => theme.spacing(0),
                    fontSize: 16,
                }}
            >
                {currentUser.account.name}
            </Typography>
        );
    }

    return (
        <>
            <Typography
                ref={anchorRef}
                variant="body2"
                color={color}
                onClick={handleToggle}
                sx={{
                    padding: theme => theme.spacing(0),
                    cursor: 'pointer',
                    fontSize: 16,
                    '&:hover': {
                        color: theme => theme.palette.secondary.main,
                    },
                }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
            >
                {currentUser.account.name}
            </Typography>
            <Popper
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                placement="bottom-end"
                transition
                disablePortal
            >
                {({ TransitionProps }) => (
                    <Grow
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...TransitionProps}
                        style={{
                            transformOrigin: 'right bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList
                                    autoFocusItem={open}
                                    id="account-menu"
                                    aria-labelledby="account-button"
                                    onKeyDown={menuListKeyDownHandler}
                                >
                                    {currentUser.other_accounts.map(account => (
                                        <MenuItem
                                            key={account.id}
                                            selected={
                                                account.id ===
                                                currentUser.account.id
                                            }
                                            onClick={() =>
                                                switchAccount(account.id)
                                            }
                                        >
                                            {account.name}
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
