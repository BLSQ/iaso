import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Alert, Box, Grid } from '@mui/material';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import isEmpty from 'lodash/isEmpty';
import InputComponent from '../../../components/forms/InputComponent';
import { SxStyles } from '../../../types/general';
import { useCurrentUser } from '../../../utils/usersUtils';
import { useAppLocales } from '../../app/constants';

import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests';
import MESSAGES from '../messages';
import { InitialUserData, UserDialogData } from '../types';
import { userHasAccessToModule } from '../utils';

const styles: SxStyles = {
    passwordDisabled: {
        opacity: 0.5,
    },
    alert: {
        marginBottom: '1rem',
    },
};

type Props = {
    setFieldValue: (key: string, value: string) => void;
    currentUser: UserDialogData;
    initialData: InitialUserData;
    allowSendEmailInvitation: boolean;
    canBypassProjectRestrictions: boolean;
    setPhoneNumber: (phoneNumber: string, countryCode: string) => void;
    setEmail: (email: string) => void;
};

export const UsersInfos: FunctionComponent<Props> = ({
    setFieldValue,
    currentUser,
    initialData,
    allowSendEmailInvitation,
    canBypassProjectRestrictions,
    setPhoneNumber,
    setEmail,
}) => {
    const loggedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();

    const isEmailAdressExist = isEmpty(currentUser.email?.value);
    const sendUserEmailInvitation = !!isEmailAdressExist;
    const sendUserIEmailnvitationLabel = isEmailAdressExist
        ? MESSAGES.sentEmailInvitationWhenAdresseExist
        : MESSAGES.sentEmailInvitation;
    const isMultiAccountUser = currentUser.has_multiple_accounts.value;
    const passwordDisabled = currentUser.send_email_invitation.value;

    const { data: allProjects, isFetching: isFetchingProjects } =
        useGetProjectsDropdownOptions(true, canBypassProjectRestrictions);

    const availableProjects = useMemo(() => {
        if (!loggedUser || !loggedUser.projects) {
            return [];
        }
        return allProjects?.map(project => {
            return {
                value: project.value,
                label: project.label,
                color: project.color,
            };
        });
    }, [allProjects, loggedUser]);

    const isInitialDataEmpty = isEmpty(initialData)
        ? MESSAGES.password
        : MESSAGES.newPassword;

    const handlePhoneNumberChange = useCallback(
        (_, phoneNumber, country) => {
            setPhoneNumber(phoneNumber, country.countryCode);
        },
        [setPhoneNumber],
    );

    const appLocales = useAppLocales();
    return (
        <form>
            {isMultiAccountUser && (
                <Alert severity="info" sx={styles.alert}>
                    {formatMessage(
                        MESSAGES.multiAccountUserInfoDisabledWarning,
                        {
                            account: loggedUser.account?.name,
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
                        value={currentUser.first_name?.value}
                        errors={currentUser.first_name?.errors}
                        type="text"
                        label={MESSAGES.firstName}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="last_name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.last_name?.value}
                        errors={currentUser.last_name?.errors}
                        type="text"
                        label={MESSAGES.lastName}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="email"
                        onChange={(_, value) => setEmail(value)}
                        value={currentUser.email?.value}
                        errors={currentUser.email?.errors}
                        type="email"
                        label={MESSAGES.email}
                        disabled={isMultiAccountUser}
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
                    <Box sx={passwordDisabled ? styles.passwordDisabled : {}}>
                        <InputComponent
                            keyValue="password"
                            onChange={(key, value) =>
                                setFieldValue(key, value.trim())
                            }
                            value={currentUser.password.value}
                            errors={currentUser.password.errors}
                            type="password"
                            label={
                                initialData
                                    ? isInitialDataEmpty
                                    : MESSAGES.password
                            }
                            required={!initialData}
                            disabled={passwordDisabled}
                        />
                    </Box>
                </Grid>
                <Grid item sm={12} md={6}>
                    <InputComponent
                        keyValue="phone_number"
                        onChange={handlePhoneNumberChange}
                        value={currentUser.phone_number?.value}
                        type="phone"
                        phoneInputOptions={{
                            country:
                                currentUser.country_code?.value ?? undefined,
                        }}
                        label={MESSAGES.phoneNumber}
                    />
                    {userHasAccessToModule('DHIS2_MAPPING', loggedUser) && (
                        <InputComponent
                            keyValue="dhis2_id"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.dhis2_id?.value}
                            errors={currentUser.dhis2_id?.errors}
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
                            value={currentUser.home_page?.value}
                            errors={currentUser.home_page?.errors}
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
                </Grid>
            </Grid>
        </form>
    );
};
