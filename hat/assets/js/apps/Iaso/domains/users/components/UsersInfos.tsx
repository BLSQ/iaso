import React, { FunctionComponent, useCallback } from 'react';
import { Alert, Box, Grid } from '@mui/material';
import {
    useSafeIntl,
    InputWithInfos,
    BaseCountryData,
} from 'bluesquare-components';
import isEmpty from 'lodash/isEmpty';
import InputComponent from '../../../components/forms/InputComponent';
import { SxStyles } from '../../../types/general';
import { useCurrentUser } from '../../../utils/usersUtils';
import { useAppLocales } from '../../app/constants';

import { useSavePassword } from '../hooks/useSavePassword';
import MESSAGES from '../messages';
import {
    InitialUserData,
    ProfileRetrieveResponseItem,
    UserDialogData,
} from '../types';
import { userHasAccessToModule } from '../utils';
import { EditPasswordUserWithButtonDialog } from './EditPasswordUserDialog';
import { UsersInfosExtraFields } from './UsersInfosExtraFields';

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
    initialData: InitialUserData | ProfileRetrieveResponseItem;
    allowSendEmailInvitation: boolean;
    canBypassProjectRestrictions: boolean;
    setPhoneNumber: (phoneNumber: string, countryCode: string) => void;
    setEmail: (email: string) => void;
    mode: 'create' | 'edit';
};

export const UsersInfos: FunctionComponent<Props> = ({
    setFieldValue,
    currentUser,
    initialData,
    allowSendEmailInvitation,
    canBypassProjectRestrictions,
    setPhoneNumber,
    setEmail,
    mode,
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

    const { mutate: savePassword } = useSavePassword(initialData?.id);

    const isInitialDataEmpty = isEmpty(initialData)
        ? MESSAGES.password
        : MESSAGES.newPassword;

    const handlePhoneNumberChange = useCallback(
        (_: any, phoneNumber: string, country: any) => {
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

                    {mode === 'edit' && (
                        <UsersInfosExtraFields
                            setFieldValue={setFieldValue}
                            currentUser={currentUser}
                            loggedUser={loggedUser}
                            canBypassProjectRestrictions={
                                canBypassProjectRestrictions
                            }
                        />
                    )}
                    {mode === 'create' && (
                        <>
                            {allowSendEmailInvitation && (
                                <Box sx={{ mb: 3 }}>
                                    <InputComponent
                                        keyValue="send_email_invitation"
                                        onChange={(key, value) =>
                                            setFieldValue(key, value)
                                        }
                                        value={
                                            currentUser.send_email_invitation
                                                .value
                                        }
                                        type="checkbox"
                                        disabled={sendUserEmailInvitation}
                                        label={sendUserIEmailnvitationLabel}
                                    />
                                </Box>
                            )}
                            <Box
                                sx={
                                    passwordDisabled
                                        ? styles.passwordDisabled
                                        : {}
                                }
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
                        </>
                    )}
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

                    {mode === 'edit' && (
                        <Box pt={3} display="flex" justifyContent="flex-end">
                            <EditPasswordUserWithButtonDialog
                                titleMessage={MESSAGES.updateUserPassword}
                                savePassword={savePassword}
                            />
                        </Box>
                    )}
                    {mode === 'create' && (
                        <UsersInfosExtraFields
                            setFieldValue={setFieldValue}
                            currentUser={currentUser}
                            loggedUser={loggedUser}
                            canBypassProjectRestrictions={
                                canBypassProjectRestrictions
                            }
                        />
                    )}
                </Grid>
            </Grid>
        </form>
    );
};
