import Menu from '@mui/material/Menu';
import { makeStyles } from '@mui/styles';
import React from 'react';

import { useSaveCurrentUser } from '../../users/hooks/useSaveCurrentUser.ts';
import { APP_LOCALES } from '../constants';
import { useLocale } from '../contexts/LocaleContext.tsx';

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
    const { locale: activeLocaleCode, setLocale } = useLocale();
    const activeLocale = APP_LOCALES.find(
        locale => locale.code === activeLocaleCode,
    );

    const { mutate: saveCurrentUser } = useSaveCurrentUser(false);

    const handleClickListItem = event => {
        setAnchorEl(event.currentTarget);
    };

    const handleLocaleSwitch = localeCode => {
        setLocale(localeCode);
        saveCurrentUser({
            language: localeCode,
        });
        setAnchorEl(null);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div className={classes.wrapper}>
            <Menu
                id="lock-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            />
        </div>
    );
}
