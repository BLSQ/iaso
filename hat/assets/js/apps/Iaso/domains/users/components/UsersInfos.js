/* eslint-disable no-param-reassign */
import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import { Grid } from '@material-ui/core';
import InputComponent from '../../../components/forms/InputComponent';
import { APP_LOCALES } from '../../app/constants';

import { useGetProjectsDropdownOptions } from '../../projects/hooks/requests.ts';

import MESSAGES from '../messages';

const UsersInfos = ({
    setFieldValue,
    currentUser,
    initialData,
    allowSendEmailInvitation,
}) => {
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
        useGetProjectsDropdownOptions();

    const isInitialDataEmpty = isEmpty(initialData)
        ? MESSAGES.password
        : MESSAGES.newPassword;

    return (
        <form>
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
                    />
                    <InputComponent
                        keyValue="first_name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.first_name.value}
                        errors={currentUser.first_name.errors}
                        type="text"
                        label={MESSAGES.firstName}
                    />
                    <InputComponent
                        keyValue="last_name"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.last_name.value}
                        errors={currentUser.last_name.errors}
                        type="text"
                        label={MESSAGES.lastName}
                    />
                    <InputComponent
                        keyValue="email"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.email.value}
                        errors={currentUser.email.errors}
                        type="email"
                        label={MESSAGES.email}
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
                        disabled={passwordDisabled}
                    />
                </Grid>
                <Grid item sm={12} md={6}>
                    <InputComponent
                        keyValue="dhis2_id"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.dhis2_id.value}
                        errors={currentUser.dhis2_id.errors}
                        type="text"
                        label={MESSAGES.dhis2_id}
                    />
                    <InputComponent
                        keyValue="home_page"
                        onChange={(key, value) => setFieldValue(key, value)}
                        value={currentUser.home_page.value}
                        errors={currentUser.home_page.errors}
                        type="text"
                        label={MESSAGES.homePage}
                    />
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
                        options={allProjects}
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
                        options={APP_LOCALES.map(locale => {
                            return {
                                value: locale.code,
                                label: locale.label,
                            };
                        })}
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
