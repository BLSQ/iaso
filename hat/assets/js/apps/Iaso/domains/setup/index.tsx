import React, { FunctionComponent, useState, useMemo } from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ContactSupportIcon from '@mui/icons-material/ContactSupport';
import ExitIcon from '@mui/icons-material/ExitToApp';
import { Box, Button, Paper, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';

import { MENU_HEIGHT_WITHOUT_TABS, useSafeIntl } from 'bluesquare-components';
import { useFormik } from 'formik';
import { isEqual } from 'lodash';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import InputComponent from '../../components/forms/InputComponent';
import TopBar from '../../components/nav/TopBarComponent';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../libs/validation';
import { DropdownOptions } from '../../types/utils';
import { commaSeparatedIdsToStringArray } from '../../utils/forms';
import getDisplayName, { useCurrentUser } from '../../utils/usersUtils';
import { useGetModulesDropDown } from './hooks/useGetModulesDropDown';
import { useSaveAccount } from './hooks/useSaveAccount';
import { MESSAGES } from './messages';
import { SaveAccountQuery } from './types/account';
import { useAccountValidation } from './validation';

const useStyles = makeStyles(theme => ({
    paper: {
        margin: `auto`,
        width: 500,
        padding: theme.spacing(2),
        marginTop: theme.spacing(4),
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
        marginRight: theme.spacing(1),
        position: 'relative',
        top: 5,
    },
}));

export const SetupAccount: FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const [isSaved, setIsSaved] = useState<boolean>(false);
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
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
            account_name: undefined,
            user_username: undefined,
            user_first_name: undefined,
            user_last_name: undefined,
            user_email: undefined,
            password: undefined,
            email_invitation: false,
            language: 'en',
            modules: ['DATA_COLLECTION_FORMS'],
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
            setFieldValue(keyValue, commaSeparatedIdsToStringArray(value));
        } else {
            // Set empty strings to undefined to avoid backend validation issues
            const processedValue = value === '' ? undefined : value;
            setFieldValue(keyValue, processedValue);
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

    const filteredModules: DropdownOptions<string>[] = useMemo(
        () =>
            modules?.filter(
                (module: DropdownOptions<string>) => module.value !== 'DEFAULT',
            ) ?? [],
        [modules],
    );
    const allowConfirm = isValid && !isEqual(values, initialValues);
    const hasAccount = Boolean(currentUser.account);
    return (
        <>
            <TopBar
                displayBackButton={false}
                displayMenuButton={hasAccount}
                title={
                    !hasAccount
                        ? formatMessage(MESSAGES.welcome)
                        : formatMessage(MESSAGES.accountSetup)
                }
            />
            <MainWrapper>
                <Paper className={classes.paper}>
                    {isAdmin && (
                        <>
                            {isSaved && (
                                <>
                                    <Typography
                                        variant="h6"
                                        className={classes.confirmMessage}
                                    >
                                        <CheckCircleOutlineIcon
                                            className={
                                                classes.confirmMessageIcon
                                            }
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
                                            keyValue="user_first_name"
                                            labelString={formatMessage(
                                                MESSAGES.user_first_name,
                                            )}
                                            value={values.user_first_name}
                                            onChange={onChange}
                                        />
                                        <InputComponent
                                            type="text"
                                            keyValue="user_last_name"
                                            labelString={formatMessage(
                                                MESSAGES.user_last_name,
                                            )}
                                            value={values.user_last_name}
                                            onChange={onChange}
                                        />
                                        <InputComponent
                                            type="select"
                                            keyValue="language"
                                            labelString={formatMessage(
                                                MESSAGES.language,
                                            )}
                                            value={values.language}
                                            onChange={onChange}
                                            options={[
                                                {
                                                    value: 'en',
                                                    label: 'English',
                                                },
                                                {
                                                    value: 'fr',
                                                    label: 'Français',
                                                },
                                            ]}
                                        />
                                        <InputComponent
                                            type="email"
                                            keyValue="user_email"
                                            labelString={formatMessage(
                                                MESSAGES.user_email,
                                            )}
                                            value={values.user_email}
                                            onChange={onChange}
                                            errors={getErrors('user_email')}
                                        />
                                        <InputComponent
                                            type="checkbox"
                                            keyValue="email_invitation"
                                            labelString={formatMessage(
                                                MESSAGES.email_invitation,
                                            )}
                                            value={values.email_invitation}
                                            onChange={onChange}
                                        />
                                        <InputComponent
                                            type="password"
                                            required={!values.email_invitation}
                                            keyValue="password"
                                            labelString={formatMessage(
                                                MESSAGES.password,
                                            )}
                                            value={values.password}
                                            onChange={onChange}
                                            errors={getErrors('password')}
                                            disabled={values.email_invitation}
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
                                            options={filteredModules}
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
                                                {formatMessage(
                                                    MESSAGES.confirm,
                                                )}
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
                                        displayName:
                                            getDisplayName(currentUser),
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
            </MainWrapper>
        </>
    );
};
