import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import React, { FunctionComponent, useCallback } from 'react';
import { useCurrentLocale, useHasNoAccount } from '../../../utils/usersUtils';
import { APP_LOCALES } from '../../app/constants';
import { useSaveCurrentUser } from '../../users/hooks/useSaveCurrentUser';

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
    const classes: Record<string, string> = useStyles();
    const { mutate: saveCurrentUser } = useSaveCurrentUser(false);
    const hasNoAccount = useHasNoAccount();
    const activeLocale = useCurrentLocale();
    const handleClick = useCallback(
        localeCode => {
            if (hasNoAccount) {
                console.log('hasNoAccount', localeCode);
                // dispatch(switchLocale(localeCode));
            } else {
                saveCurrentUser({
                    language: localeCode,
                });
            }
        },
        [hasNoAccount, saveCurrentUser],
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
