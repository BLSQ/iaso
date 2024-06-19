import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import classNames from 'classnames';
import React, { FunctionComponent, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { setLocale } from '../../../utils/dates';
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
    const queryClient = useQueryClient();
    const handleClick = useCallback(
        localeCode => {
            if (hasNoAccount) {
                setLocale(localeCode);
                // forcing refresh of the app while changing the locale
                queryClient.invalidateQueries('currentUser');
            } else {
                saveCurrentUser({
                    language: localeCode,
                });
            }
        },
        [hasNoAccount, saveCurrentUser, queryClient],
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
