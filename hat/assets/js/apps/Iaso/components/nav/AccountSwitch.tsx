import React, { FunctionComponent, useState } from 'react';

import { Menu, MenuItem, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

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

    const handleAccountSwitch = accountId => {
        console.log('accountId', accountId);
        // setLocale(localeCode);
        // saveCurrentUser({
        //     language: localeCode,
        // });
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    if (currentUser.accounts) {
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
                    {currentUser.accounts.map(account => (
                        <MenuItem
                            key={account.id}
                            selected={account.id === currentUser.account.id}
                            onClick={() => handleAccountSwitch(account.id)}
                        >
                            {account.name}
                        </MenuItem>
                    ))}
                </Menu>
            </>
        );
    } else {
        return null;
    }
};
