import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@mui/styles';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';

import { APP_LOCALES } from '../constants';
import { saveCurrentUserProFile } from '../../users/actions';

const useStyles = makeStyles(theme => ({
    currentLocale: {
        cursor: 'pointer',
    },
    wrapper: {
        marginBottom: theme.spacing(2),
        marginLeft: theme.spacing(1),
    },
}));

export default function LanguageSwitchComponent() {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const activeLocale = useSelector(state => state.app.locale);
    const dispatch = useDispatch();

    const handleClickListItem = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleLocaleSwitch = localeCode => {
        dispatch(
            saveCurrentUserProFile({
                language: localeCode,
            }),
        );
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className={classes.wrapper}>
            <Typography
                variant="body2"
                color="textSecondary"
                onClick={handleClickListItem}
                className={classes.currentLocale}
            >
                {activeLocale.label}
            </Typography>
            <Menu
                id="lock-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {APP_LOCALES.map(appLocale => (
                    <MenuItem
                        key={appLocale.code}
                        selected={appLocale.code === activeLocale.code}
                        onClick={() => handleLocaleSwitch(appLocale.code)}
                    >
                        {appLocale.label}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}
