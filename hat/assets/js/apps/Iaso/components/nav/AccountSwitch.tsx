import React, { FunctionComponent, useState } from 'react';

import { Menu, MenuItem, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSwitchAccount } from '../../hooks/useSwitchAccount';
import { useCurrentUser } from '../../utils/usersUtils';

const useStyles = makeStyles(theme => ({
    accountSwitchButton: {
        padding: theme.spacing(0),
    },
}));

type Props = {
    color?: 'inherit' | 'primary' | 'secondary';
};

export const AccountSwitch: FunctionComponent<Props> = ({
    color = 'inherit',
}) => {
    const currentUser = useCurrentUser();
    const classes = useStyles();

    const [anchorEl, setAnchorEl] = useState(null);
    const handleClickListItem = event => {
        setAnchorEl(event.currentTarget);
    };

    const { mutateAsync: switchAccount } = useSwitchAccount(() => {
        setAnchorEl(null);
        window.location.href = '/';
    });

    const handleClose = () => {
        setAnchorEl(null);
    };

    if (currentUser.other_accounts.length > 0) {
        return (
            <>
                <Typography
                    variant="body2"
                    color={color}
                    onClick={handleClickListItem}
                    className={classes.accountSwitchButton}
                >
                    {currentUser.account.name}
                </Typography>
                <Menu
                    id="lock-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    {currentUser.other_accounts.map(account => (
                        <MenuItem
                            key={account.id}
                            selected={account.id === currentUser.account.id}
                            onClick={() => switchAccount(account.id)}
                        >
                            {account.name}
                        </MenuItem>
                    ))}
                </Menu>
            </>
        );
    }
    return null;
};
