import React, { FunctionComponent, useState } from 'react';
import { makeStyles, Paper, Typography, Box, Button } from '@material-ui/core';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import ExitIcon from '@material-ui/icons/ExitToApp';

import { useSafeIntl } from 'bluesquare-components';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import getDisplayName, { useCurrentUser } from '../../utils/usersUtils';
import TopBar from '../../components/nav/TopBarComponent';
import InputComponent from '../../components/forms/InputComponent';
import { MESSAGES } from './messages';
import { useAccountValidation } from './validation';
import { useTranslatedErrors } from '../../libs/validation';
import { useSaveAccount } from './hooks/useSaveAccount';
import { switchLocale } from '../app/actions';
import { APP_LOCALES } from '../app/constants';

const useStyles = makeStyles(theme => ({
    paper: {
        margin: `${theme.spacing(4)}px auto`,
        width: 500,
        padding: theme.spacing(2),
    },
    icon: {
        // @ts-ignore
        color: theme.palette.ligthGray.border,
        fontWeight: 100,
        fontSize: 150,
    },
    confirmMessage: {
        color: theme.palette.success.main,
    },
    confirmMessageIcon: {
        fontSize: 120,
        display: 'block',
        margin: '0 auto',
    },
    languageSwitch: {
        display: 'inline-block',
        textTransform: 'uppercase',
        cursor: 'pointer',
    },
    languageSwitchActive: {
        color: theme.palette.primary.main,
    },
}));

export const SetupAccount: FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const dispatch = useDispatch();
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const activeLocale = useSelector(
        (state: { app: { locale: { code: string } } }) => state.app.locale,
    );
    const isAdmin = currentUser.is_superuser || currentUser.is_staff;
    const schema = useAccountValidation();

    const { mutateAsync: saveAccount } = useSaveAccount({
        onSuccess: () => setIsSaved(true),
    });
    const formik = useFormik({
        initialValues: {
            accountName: '',
            userName: '',
            firstName: '',
            lastName: '',
            password: '',
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: () => saveAccount(formik.values),
    });

    const {
        values,
        setFieldValue,
        setFieldTouched,
        errors,
        touched,
        isValid,
        initialValues,
        handleSubmit,
    } = formik;

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    const allowConfirm = isValid && !isEqual(values, initialValues);
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={false}
                title={formatMessage(MESSAGES.welcome)}
            />
            <Paper className={classes.paper}>
                <Box display="flex" justifyContent="flex-end">
                    {APP_LOCALES.map((locale, index) => (
                        <Box key={locale.code}>
                            <Box
                                className={classNames(
                                    classes.languageSwitch,
                                    locale.code === activeLocale.code &&
                                        classes.languageSwitchActive,
                                )}
                                onClick={() =>
                                    dispatch(switchLocale(locale.code))
                                }
                            >
                                {locale.code}
                            </Box>
                            {index + 1 !== APP_LOCALES.length && ' - '}
                        </Box>
                    ))}
                </Box>

                {isAdmin && (
                    <>
                        {isSaved && (
                            <>
                                <Typography
                                    variant="h6"
                                    className={classes.confirmMessage}
                                >
                                    <CheckCircleOutlineIcon
                                        className={classes.confirmMessageIcon}
                                    />
                                    {formatMessage(MESSAGES.confirmMessage)}
                                </Typography>
                                <Box
                                    mt={2}
                                    display="flex"
                                    justifyContent="flex-end"
                                >
                                    <Button
                                        size="small"
                                        color="primary"
                                        href="/logout-iaso"
                                        variant="contained"
                                    >
                                        <Box
                                            mr={1}
                                            display="flex"
                                            alignContent="center"
                                        >
                                            <ExitIcon fontSize="small" />
                                        </Box>
                                        {formatMessage(MESSAGES.logout)}
                                    </Button>
                                </Box>
                            </>
                        )}
                        {!isSaved && (
                            <>
                                <Typography variant="h5" color="primary">
                                    {formatMessage(MESSAGES.accountSetup)}
                                </Typography>
                                <Box>
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="accountName"
                                        labelString={formatMessage(
                                            MESSAGES.accountName,
                                        )}
                                        value={values.accountName}
                                        onChange={onChange}
                                        errors={getErrors('accountName')}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="userName"
                                        labelString={formatMessage(
                                            MESSAGES.userName,
                                        )}
                                        value={values.userName}
                                        onChange={onChange}
                                        errors={getErrors('userName')}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="firstName"
                                        labelString={formatMessage(
                                            MESSAGES.firstName,
                                        )}
                                        value={values.firstName}
                                        onChange={onChange}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="lastName"
                                        labelString={formatMessage(
                                            MESSAGES.lastName,
                                        )}
                                        value={values.lastName}
                                        onChange={onChange}
                                    />
                                    <InputComponent
                                        type="password"
                                        required
                                        keyValue="password"
                                        labelString={formatMessage(
                                            MESSAGES.password,
                                        )}
                                        value={values.password}
                                        onChange={onChange}
                                        errors={getErrors('password')}
                                    />
                                    <Box
                                        mt={2}
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <Button
                                            data-test="confirm-button"
                                            onClick={() => handleSubmit()}
                                            disabled={!allowConfirm}
                                            color="primary"
                                            autoFocus
                                            variant="contained"
                                        >
                                            {formatMessage(MESSAGES.confirm)}
                                        </Button>
                                    </Box>
                                </Box>
                            </>
                        )}
                    </>
                )}
                {!isAdmin && (
                    <Box textAlign="center">
                        <Box
                            pt={2}
                            pb={2}
                            display="flex"
                            justifyContent="center"
                            flexDirection="column"
                        >
                            <Typography variant="h6">
                                {formatMessage(MESSAGES.notAdmin, {
                                    displayName: getDisplayName(currentUser),
                                })}
                            </Typography>
                            <Typography>
                                {formatMessage(MESSAGES.notAdmin2)}
                            </Typography>
                        </Box>
                        <ContactSupportIcon className={classes.icon} />
                    </Box>
                )}
            </Paper>
        </>
    );
};
