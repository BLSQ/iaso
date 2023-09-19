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
import { SaveAccountQuery } from './types/account';
import getDisplayName, { useCurrentUser } from '../../utils/usersUtils';
import TopBar from '../../components/nav/TopBarComponent';
import InputComponent from '../../components/forms/InputComponent';
import { MESSAGES } from './messages';
import { useAccountValidation } from './validation';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../libs/validation';
import { useSaveAccount } from './hooks/useSaveAccount';
import { switchLocale } from '../app/actions';
import { APP_LOCALES } from '../app/constants';
import { useGetModulesDropDown } from './hooks/useGetModulesDropDown';

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
        padding: theme.spacing(0, 0.5),
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

    const { mutateAsync: saveAccount, isLoading } = useSaveAccount();
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<SaveAccountQuery, any>({
        mutationFn: saveAccount,
        onSuccess: () => {
            setIsSaved(true);
        },
    });
    const schema = useAccountValidation(apiErrors, payload);
    const formik = useFormik({
        initialValues: {
            account_name: '',
            user_username: '',
            user_first_name: '',
            user_last_name: '',
            password: '',
            modules: [],
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
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
        if (keyValue === 'modules' && value) {
            setFieldValue(keyValue, value.split(','));
        } else {
            setFieldValue(keyValue, value);
        }
    };

    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });

    const { data: modules, isFetching: isFetchingModules } =
        useGetModulesDropDown();

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
                            {index + 1 !== APP_LOCALES.length && '-'}
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
                                        keyValue="account_name"
                                        labelString={formatMessage(
                                            MESSAGES.account_name,
                                        )}
                                        value={values.account_name}
                                        onChange={onChange}
                                        errors={getErrors('account_name')}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="user_username"
                                        labelString={formatMessage(
                                            MESSAGES.user_username,
                                        )}
                                        value={values.user_username}
                                        onChange={onChange}
                                        errors={getErrors('user_username')}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="user_first_name"
                                        labelString={formatMessage(
                                            MESSAGES.user_first_name,
                                        )}
                                        value={values.user_first_name}
                                        onChange={onChange}
                                    />
                                    <InputComponent
                                        type="text"
                                        required
                                        keyValue="user_last_name"
                                        labelString={formatMessage(
                                            MESSAGES.user_last_name,
                                        )}
                                        value={values.user_last_name}
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
                                    <InputComponent
                                        type="select"
                                        multi
                                        required
                                        keyValue="modules"
                                        labelString={formatMessage(
                                            MESSAGES.modules,
                                        )}
                                        value={values.modules}
                                        onChange={onChange}
                                        errors={getErrors('modules')}
                                        loading={isFetchingModules}
                                        options={modules ?? []}
                                    />
                                    <Box
                                        mt={2}
                                        display="flex"
                                        justifyContent="flex-end"
                                    >
                                        <Button
                                            data-test="confirm-button"
                                            onClick={() => handleSubmit()}
                                            disabled={
                                                !allowConfirm || isLoading
                                            }
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
