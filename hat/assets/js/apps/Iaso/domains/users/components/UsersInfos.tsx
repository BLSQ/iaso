import React, { useCallback, useMemo } from 'react';
import { Alert, Box, Grid } from '@mui/material';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import isEmpty from 'lodash/isEmpty';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
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
    withPassword?: boolean;
};

export const UsersInfos = ({
    setFieldValue,
    currentUser,
    initialData,
    allowSendEmailInvitation,
    canBypassProjectRestrictions,
    setPhoneNumber,
    setEmail,
    withPassword = true,
}: Props) => {
    const loggedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();

    const isEmailAdressExist = isEmpty(currentUser.email?.value);
    const sendUserEmailInvitation = !!isEmailAdressExist;
    const sendUserIEmailnvitationLabel = isEmailAdressExist
        ? MESSAGES.sentEmailInvitationWhenAdresseExist
        : MESSAGES.sentEmailInvitation;
    const isMultiAccountUser = currentUser.hasMultipleAccounts.value;
    const passwordDisabled = currentUser.sendEmailInvitation.value;

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
                        keyValue="userName"
                        onChange={(key, value) =>
                            setFieldValue(key, value.trim())
                        }
                        value={currentUser.userName.value}
                        errors={currentUser.userName.errors}
                        type="text"
                        label={MESSAGES.userName}
                        required
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="firstName"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.firstName?.value}
                        errors={currentUser.firstName?.errors}
                        type="text"
                        label={MESSAGES.firstName}
                        disabled={isMultiAccountUser}
                    />
                    <InputComponent
                        keyValue="lastName"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.lastName?.value}
                        errors={currentUser.lastName?.errors}
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

                    {allowSendEmailInvitation && withPassword && (
                        <InputComponent
                            keyValue="sendEmailInvitation"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.sendEmailInvitation.value}
                            type="checkbox"
                            disabled={sendUserEmailInvitation}
                            label={sendUserIEmailnvitationLabel}
                        />
                    )}
                    {withPassword && (
                        <Box
                            sx={passwordDisabled ? styles.passwordDisabled : {}}
                        >
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
                    )}
                </Grid>
                <Grid item sm={12} md={6}>
                    <InputComponent
                        keyValue="phoneNumber"
                        onChange={handlePhoneNumberChange}
                        value={currentUser.phoneNumber?.value}
                        type="phone"
                        phoneInputOptions={{
                            country:
                                currentUser.countryCode?.value ?? undefined,
                        }}
                        label={MESSAGES.phoneNumber}
                    />
                    {userHasAccessToModule('DHIS2_MAPPING', loggedUser) && (
                        <InputComponent
                            keyValue="dhis2Id"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.dhis2Id?.value}
                            errors={currentUser.dhis2Id?.errors}
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
                            keyValue="homePage"
                            onChange={(key, value) => setFieldValue(key, value)}
                            value={currentUser.homePage?.value}
                            errors={currentUser.homePage?.errors}
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
                    <Box sx={{ pt: 2, pb: 2 }}>
                        <ColorPicker
                            currentColor={currentUser?.color?.value}
                            onChangeColor={(color: string): void =>
                                setFieldValue('color', color)
                            }
                        />
                    </Box>
                </Grid>
            </Grid>
        </form>
    );
};
