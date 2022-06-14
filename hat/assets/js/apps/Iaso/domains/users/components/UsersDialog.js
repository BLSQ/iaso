import React, { useMemo, useState, useEffect } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Tabs, Tab, makeStyles } from '@material-ui/core';
import { useSafeIntl } from 'bluesquare-components';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import UsersInfos from './UsersInfos';
import { fetchCurrentUser } from '../actions';
import MESSAGES from '../messages';
import UsersLocations from './UsersLocations';
import PermissionsSwitches from './PermissionsSwitches';
import { useCurrentUser } from '../../../utils/usersUtils';

const useStyles = makeStyles(theme => ({
    tabs: {
        marginBottom: theme.spacing(4),
    },
    tab: {
        padding: 0,
        width: 'calc(100% / 4)',
        minWidth: 0,
    },
    root: {
        minHeight: 365,
        position: 'relative',
    },
    hiddenOpacity: {
        position: 'absolute',
        top: 0,
        left: -5000,
        zIndex: -10,
        opacity: 0,
    },
}));

const UserDialogComponent = ({
    titleMessage,
    renderTrigger,
    initialData = {},
    saveProfile,
    allowSendEmailInvitation,
}) => {
    const connectedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes = useStyles();

    const initialUser = useMemo(() => {
        const newInitialData = initialData || {};
        return {
            id: { value: get(newInitialData, 'id', null), errors: [] },
            user_name: {
                value: get(newInitialData, 'user_name', ''),
                errors: [],
            },
            first_name: {
                value: get(newInitialData, 'first_name', ''),
                errors: [],
            },
            last_name: {
                value: get(newInitialData, 'last_name', ''),
                errors: [],
            },
            email: { value: get(newInitialData, 'email', ''), errors: [] },
            password: { value: '', errors: [] },
            permissions: {
                value: get(newInitialData, 'permissions', []),
                errors: [],
            },
            org_units: {
                value: get(newInitialData, 'org_units', []),
                errors: [],
            },
            language: {
                value: get(newInitialData, 'language', ''),
                errors: [],
            },
            dhis2_id: {
                value: get(newInitialData, 'dhis2_id', ''),
                errors: [],
            },
            send_email_invitation: {
                value: get(newInitialData, 'send_email_invitation', false),
                errors: [],
            },
        };
    }, [initialData]);
    const [user, setUser] = useState(initialUser);
    const [tab, setTab] = useState('infos');
    const onClosed = () => {
        setUser(initialUser);
        setTab('infos');
    };

    const setFieldValue = (fieldName, fieldValue) => {
        setUser({
            ...user,
            [fieldName]: {
                value: fieldValue,
                errors: [],
            },
        });
    };

    const setFieldErrors = (fieldName, fieldError) => {
        setUser({
            ...user,
            [fieldName]: {
                value: user[fieldName].value,
                errors: [fieldError],
            },
        });
    };

    const onConfirm = closeDialog => {
        const currentUser = {};
        Object.keys(user).forEach(key => {
            currentUser[key] = user[key].value;
        });

        saveProfile(currentUser, {
            onSuccess: () => {
                closeDialog();
                setTab('infos');
                setUser(initialUser);
                if (currentUser.id === connectedUser.id) {
                    dispatch(fetchCurrentUser());
                }
            },
            onError: error => {
                if (error.status === 400) {
                    setFieldErrors(
                        error.details.errorKey,
                        error.details.errorMessage,
                    );
                }
            },
        });
    };

    useEffect(() => {
        setUser(initialUser);
    }, [initialData, initialUser]);

    return (
        <ConfirmCancelDialogComponent
            titleMessage={titleMessage}
            onConfirm={closeDialog => onConfirm(closeDialog)}
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.save}
            onClosed={() => onClosed()}
            renderTrigger={renderTrigger}
            maxWidth="sm"
            dialogProps={{
                classNames: classes.dialog,
            }}
        >
            <Tabs
                id="user-dialog-tabs"
                value={tab}
                classes={{
                    root: classes.tabs,
                }}
                onChange={(_event, newtab) => setTab(newtab)}
            >
                <Tab
                    classes={{
                        root: classes.tab,
                    }}
                    value="infos"
                    label={formatMessage(MESSAGES.infos)}
                />
                <Tab
                    classes={{
                        root: classes.tab,
                    }}
                    value="permissions"
                    label={formatMessage(MESSAGES.permissions)}
                />
                <Tab
                    classes={{
                        root: classes.tab,
                    }}
                    value="locations"
                    label={formatMessage(MESSAGES.location)}
                />
            </Tabs>
            <div className={classes.root} id="user-profile-dialog">
                {tab === 'infos' && (
                    <UsersInfos
                        setFieldValue={(key, value) =>
                            setFieldValue(key, value)
                        }
                        initialData={initialData}
                        currentUser={user}
                        allowSendEmailInvitation={allowSendEmailInvitation}
                    />
                )}
                <div
                    className={
                        tab === 'permissions' ? '' : classes.hiddenOpacity
                    }
                >
                    <PermissionsSwitches
                        isSuperUser={initialData?.is_superuser}
                        currentUser={user}
                        handleChange={permissions =>
                            setFieldValue('permissions', permissions)
                        }
                    />
                </div>
                {tab === 'locations' && (
                    <UsersLocations
                        handleChange={ouList =>
                            setFieldValue('org_units', ouList)
                        }
                        currentUser={user}
                    />
                )}
            </div>
        </ConfirmCancelDialogComponent>
    );
};

UserDialogComponent.defaultProps = {
    initialData: null,
};

UserDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    saveProfile: PropTypes.func.isRequired,
};

export default UserDialogComponent;
