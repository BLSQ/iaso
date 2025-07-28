/* eslint-disable no-param-reassign */
import React, { useCallback, useMemo } from 'react';
import { Alert, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import isEmpty from 'lodash/isEmpty';
import PropTypes from 'prop-types';
import InputComponent from '../../../components/forms/InputComponent.tsx';
import { useCurrentUser } from '../../../utils/usersUtils.ts';
import { useAppLocales } from '../../app/constants';

import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests.ts';
import { userHasAccessToModule } from '../utils.js';

import MESSAGES from '../messages.ts';

const useStyles = makeStyles(theme => ({
    alert: {
        marginBottom: theme.spacing(1),
    },
}));

const UsersInfos = ({
    setFieldValue,
    currentUser,
    initialData,
    allowSendEmailInvitation,
    canBypassProjectRestrictions,
}) => {
    const loggedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();

    const isEmailAdressExist = isEmpty(currentUser.email.value);
    const sendUserEmailInvitation = !!isEmailAdressExist;
    const sendUserIEmailnvitationLabel = isEmailAdressExist
        ? MESSAGES.sentEmailInvitationWhenAdresseExist
        : MESSAGES.sentEmailInvitation;
    let passwordDisabled = false;

    if (currentUser.send_email_invitation) {
        if (sendUserEmailInvitation) {
            // eslint-disable-next-line no-param-reassign
            currentUser.send_email_invitation.value = false;
        }
        if (currentUser.send_email_invitation.value) {
            initialData = {};
            currentUser.password.value = null;
            passwordDisabled = true;
        }
    }
    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions(true, canBypassProjectRestrictions);

    const availableProjects = useMemo(() => {
        if (!loggedUser || !loggedUser.projects) {
            return [];
        }
        return allProjects.map(project => {
            return {
                value: project.value,
                label: project.label,
            };
        });
    }, [allProjects, loggedUser]);

    const isInitialDataEmpty = isEmpty(initialData)
        ? MESSAGES.password
        : MESSAGES.newPassword;

    const handlePhoneNumberChange = useCallback(
        (_, phoneNumber, countryCode) => {
            setFieldValue('phone_number_obj', {
                phone_number: phoneNumber,
                country_code: countryCode,
            });
        },
        [setFieldValue],
    );

    const isMultiAccountUser = currentUser.has_multiple_accounts.value;
    const appLocales = useAppLocales();
    return (
        <form>
            {isMultiAccountUser && (
                <Alert severity="info" className={classes.alert}>
                    {formatMessage(
                        MESSAGES.multiAccountUserInfoDisabledWarning,
                        {
                            account: loggedUser.account.name,
                        },
                    )}
                </Alert>
            )}
            <Grid container spacing={2}>
                <Grid item sm={12} md={6}>
                    <InputComponent
                        keyValue="user_name"
                        onChange={(key, value) =>
                            setFieldValue(key, value.trim())
                        }
                        value={currentUser.user_name.value}
                        errors={currentUser.user_name.errors}
                        type="text"
                        label={MESSAGES.userName}
                        required
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="first_name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.first_name.value}
                        errors={currentUser.first_name.errors}
                        type="text"
                        label={MESSAGES.firstName}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="last_name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.last_name.value}
                        errors={currentUser.last_name.errors}
                        type="text"
                        label={MESSAGES.lastName}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="email"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.email.value}
                        errors={currentUser.email.errors}
                        type="email"
                        label={MESSAGES.email}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="password"
                        onChange={(key, value) =>
                            setFieldValue(key, value.trim())
                        }
                        value={currentUser.password.value}
                        errors={currentUser.password.errors}
                        type="password"
                        label={
                            initialData ? isInitialDataEmpty : MESSAGES.password
                        }
                        required={!initialData}
                        disabled={
                            passwordDisabled ||
                            (isMultiAccountUser &&
                                loggedUser.id !== currentUser.id.value)
                        }
                    />
                </Grid>
                <Grid item sm={12} md={6}>
                    {userHasAccessToModule('DHIS2_MAPPING', loggedUser) && (
                        <InputComponent
                            keyValue="dhis2_id"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.dhis2_id.value}
                            errors={currentUser.dhis2_id.errors}
                            type="text"
                            label={MESSAGES.dhis2_id}
                        />
                    )}

                    <InputComponent
                        keyValue="organization"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.organization?.value}
                        errors={currentUser.organization?.errors ?? []}
                        type="text"
                        label={MESSAGES.organization}
                    />
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.homePageInfos)}
                    >
                        <InputComponent
                            keyValue="home_page"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.home_page.value}
                            errors={currentUser.home_page.errors}
                            type="text"
                            label={MESSAGES.homePage}
                        />
                    </InputWithInfos>
                    <InputComponent
                        keyValue="projects"
                        onChange={(key, value) =>
                            setFieldValue(
                                key,
                                value
                                    ?.split(',')
                                    .map(projectId => parseInt(projectId, 10)),
                            )
                        }
                        value={currentUser.projects.value}
                        errors={currentUser.projects.errors}
                        type="select"
                        multi
                        label={MESSAGES.projects}
                        options={availableProjects}
                        loading={isFetchingProjects}
                    />
                    <InputComponent
                        keyValue="language"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.language.value}
                        errors={currentUser.language.errors}
                        type="select"
                        multi={false}
                        label={MESSAGES.locale}
                        options={appLocales.map(locale => {
                            return {
                                value: locale.code,
                                label: locale.label,
                            };
                        })}
                    />
                    <InputComponent
                        keyValue="phone_number"
                        onChange={handlePhoneNumberChange}
                        value={currentUser.phone_number?.value}
                        type="phone"
                        country={currentUser.country_code?.value}
                        label={MESSAGES.phoneNumber}
                    />

                    {allowSendEmailInvitation && (
                        <InputComponent
                            keyValue="send_email_invitation"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.send_email_invitation.value}
                            type="checkbox"
                            disabled={sendUserEmailInvitation}
                            label={sendUserIEmailnvitationLabel}
                        />
                    )}
                </Grid>
            </Grid>
        </form>
    );
};

UsersInfos.defaultProps = {
    initialData: null,
    allowSendEmailInvitation: false,
};

UsersInfos.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    initialData: PropTypes.object,
    allowSendEmailInvitation: PropTypes.bool,
};

export default UsersInfos;
