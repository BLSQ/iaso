/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import InputComponent from '../../../components/forms/InputComponent';
import { APP_LOCALES } from '../../app/constants';
import { useTranslatedErrors } from '../../../libs/validation.tsx';

import MESSAGES from '../messages';

const UsersInfos = ({
    setFieldValue,
    setFieldTouched,
    // errors,
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

    const isInitialDataEmpty = isEmpty(initialData)
        ? MESSAGES.password
        : MESSAGES.newPassword;

    // TO DO: add the functon below after passed setFieldTouched prop
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

    return (
        <>
            <InputComponent
                keyValue="user_name"
                // onChange={(key, value) => setFieldValue(key, value.trim())}
                onChange={onChange}
                value={currentUser.user_name.value}
                // errors={currentUser.user_name.errors}
                errors={getErrors('user_name')}
                type="text"
                label={MESSAGES.userName}
                required
            />
            <InputComponent
                keyValue="first_name"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.first_name.value}
                // errors={currentUser.first_name.errors}
                errors={getErrors('first_name')}
                type="text"
                label={MESSAGES.firstName}
            />
            <InputComponent
                keyValue="last_name"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.last_name.value}
                // errors={currentUser.last_name.errors}
                errors={getErrors('last_name')}
                type="text"
                label={MESSAGES.lastName}
            />
            <InputComponent
                keyValue="email"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.email.value}
                // errors={currentUser.email.errors}
                errors={getErrors('email')}
                type="email"
                label={MESSAGES.email}
            />
            <InputComponent
                keyValue="password"
                // onChange={(key, value) => setFieldValue(key, value.trim())}
                onChange={onChange}
                value={currentUser.password.value}
                // errors={currentUser.password.errors}
                errors={getErrors('password')}
                type="password"
                label={initialData ? isInitialDataEmpty : MESSAGES.password}
                required={!initialData}
                disabled={passwordDisabled}
            />
            <InputComponent
                keyValue="dhis2_id"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.dhis2_id.value}
                // errors={currentUser.dhis2_id.errors}
                errors={getErrors('dhis2_id')}
                type="text"
                label={MESSAGES.dhis2_id}
            />
            <InputComponent
                keyValue="home_page"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.home_page.value}
                // errors={currentUser.home_page.errors}
                errors={getErrors('home_page')}
                type="text"
                label={MESSAGES.homePage}
            />
            <InputComponent
                keyValue="language"
                // onChange={(key, value) => setFieldValue(key, value)}
                onChange={onChange}
                value={currentUser.language.value}
                // errors={currentUser.language.errors}
                errors={getErrors('language')}
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
                    // onChange={(key, value) => setFieldValue(key, value)}
                    onChange={onChange}
                    value={currentUser.send_email_invitation.value}
                    type="checkbox"
                    disabled={sendUserEmailInvitation}
                    label={sendUserIEmailnvitationLabel}
                />
            )}
        </>
    );
};

UsersInfos.defaultProps = {
    initialData: null,
};

UsersInfos.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    setFieldTouched: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    initialData: PropTypes.object,
    touched: PropTypes.bool,
};

export default UsersInfos;
