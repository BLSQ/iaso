import React, { FunctionComponent } from 'react';
import { makeStyles, Box } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { switchLocale } from '../../app/actions';
import { APP_LOCALES } from '../../app/constants';

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
    const activeLocale = useSelector(
        (state: { app: { locale: { code: string } } }) => state.app.locale,
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
                        onClick={() => dispatch(switchLocale(locale.code))}
                    >
                        {locale.code}
                    </Box>
                    {index + 1 !== APP_LOCALES.length && '-'}
                </Box>
            ))}
        </>
    );
};
