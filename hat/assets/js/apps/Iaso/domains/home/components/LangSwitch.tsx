import React, { FunctionComponent, useCallback } from 'react';
import { makeStyles, Box } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { switchLocale } from '../../app/actions';
import { APP_LOCALES } from '../../app/constants';
import { useHasNoAccount } from '../../../utils/usersUtils';
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
    const activeLocale = useSelector(
        (state: { app: { locale: { code: string } } }) => state.app.locale,
    );
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
                            locale.code === activeLocale.code &&
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
