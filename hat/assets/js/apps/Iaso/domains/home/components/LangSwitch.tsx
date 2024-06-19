import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import React, { FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useCurrentLocale, useHasNoAccount } from '../../../utils/usersUtils';
import { switchLocale } from '../../app/actions';
import { APP_LOCALES } from '../../app/constants';
import { saveCurrentUserProFile } from '../../users/actions';

const useStyles = makeStyles(theme => ({
    languageSwitch: {
        display: 'inline-block',
        textTransform: 'uppercase',
        cursor: 'pointer',
        padding: theme.spacing(0, 0.5),
    },
    languageSwitchActive: {
        color: theme.palette.primary.main,
    },
}));

export const LangSwitch: FunctionComponent = () => {
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const hasNoAccount = useHasNoAccount();
    const activeLocale = useCurrentLocale();
    const handleClick = useCallback(
        localeCode => {
            if (hasNoAccount) {
                dispatch(switchLocale(localeCode));
            } else {
                dispatch(
                    saveCurrentUserProFile({
                        language: localeCode,
                    }),
                );
            }
        },
        [dispatch, hasNoAccount],
    );
    return (
        <>
            {APP_LOCALES.map((locale, index) => (
                <Box key={locale.code}>
                    <Box
                        className={classNames(
                            classes.languageSwitch,
                            locale.code === activeLocale &&
                                classes.languageSwitchActive,
                        )}
                        onClick={() => handleClick(locale.code)}
                    >
                        {locale.code}
                    </Box>
                    {index + 1 !== APP_LOCALES.length && '-'}
                </Box>
            ))}
        </>
    );
};
