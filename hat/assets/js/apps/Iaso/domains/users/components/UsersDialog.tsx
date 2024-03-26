/* eslint-disable camelcase */
import React, { useState, FunctionComponent, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Tabs, Tab } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormikProvider, useFormik } from 'formik';
import {
    IntlMessage,
    useSafeIntl,
    makeFullModal,
    ConfirmCancelModal,
    AddButton,
} from 'bluesquare-components';

import { MutateFunction } from 'react-query';

import { isEqual } from 'lodash';
import UsersInfos from './UsersInfos';
import { fetchCurrentUser } from '../actions';
import MESSAGES from '../messages';
import UsersLocations from './UsersLocations';
import PermissionsSwitches from './PermissionsSwitches';
import { Profile, useCurrentUser } from '../../../utils/usersUtils';
import { useInitialUser } from './useInitialUser';
import { InitialUserData } from '../types';
import { WarningModal } from './WarningModal/WarningModal';
import { EditIconButton } from '../../../components/Buttons/EditIconButton';

const useStyles = makeStyles(theme => ({
    tabs: {
        marginBottom: theme.spacing(3),
    },
    tab: {
        padding: 0,
        width: '25%',
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

type Props = {
    titleMessage: IntlMessage;
    initialData?: InitialUserData;
    saveProfile: MutateFunction<Profile, any>;
    allowSendEmailInvitation?: boolean;
    isOpen: boolean;
    closeDialog: () => void;
};
// Declaring defaultData here because using initialData={} in the props below will cause and infinite loop
const defaultData: InitialUserData = {};
const UserDialogComponent: FunctionComponent<Props> = ({
    titleMessage,
    isOpen,
    initialData = defaultData,
    saveProfile,
    allowSendEmailInvitation = false,
    closeDialog,
}) => {
    const connectedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const { user, setFormFieldsValue, setFieldErrors } =
        useInitialUser(initialData);
    const [tab, setTab] = useState('infos');
    const [openWarning, setOpenWarning] = useState<boolean>(false);

    const formik = useFormik({
        initialValues: user,
        enableReinitialize: true,
        validateOnBlur: true,
        onSubmit: () => {
            onConfirm();
        },
    });

    const {
        values,
        setFieldValue,
        initialValues,
        handleSubmit,
        isValid,
        resetForm,
        isSubmitting,
    } = formik;
    const saveUser = useCallback(() => {
        const currentUser: any = {};
        Object.keys(values).forEach(key => {
            currentUser[key] = values[key].value;
        });
        saveProfile(currentUser, {
            onSuccess: () => {
                if (currentUser.id === connectedUser.id) {
                    dispatch(fetchCurrentUser());
                }
                closeDialog();
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
    }, [
        closeDialog,
        connectedUser.id,
        dispatch,
        saveProfile,
        setFieldErrors,
        values,
    ]);

    const onConfirm = useCallback(() => {
        const userPermissions = values?.user_permissions.value ?? [];
        const userRolesPermissions = values?.user_roles_permissions.value ?? [];
        if (
            userPermissions.length > 0 ||
            userRolesPermissions.length > 0 ||
            initialData?.is_superuser
        ) {
            saveUser();
        } else {
            setOpenWarning(true);
        }
    }, [
        initialData?.is_superuser,
        saveUser,
        values?.user_permissions.value,
        values?.user_roles_permissions.value,
    ]);

    const fieldsConfirm =
        values.user_name.value === '' ||
        (!values.id?.value &&
            (values.password.value === '' || values.password.value === null) &&
            values.send_email_invitation.value === false);

    const allowConfirm =
        isValid &&
        !fieldsConfirm &&
        !isSubmitting &&
        !isEqual(values, initialValues);

    const warningConfirm = () => {
        saveUser();
    };

    return (
        <FormikProvider value={formik}>
            <WarningModal
                open={openWarning}
                closeDialog={() => setOpenWarning(false)}
                onConfirm={warningConfirm}
            />

            <ConfirmCancelModal
                titleMessage={titleMessage}
                onConfirm={handleSubmit}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                maxWidth="md"
                open={isOpen}
                closeDialog={() => null}
                allowConfirm={allowConfirm}
                onClose={() => null}
                onCancel={() => {
                    closeDialog();
                    resetForm();
                }}
                id="user-dialog"
                dataTestId="user-dialog"
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
                    <div
                        className={tab === 'infos' ? '' : classes.hiddenOpacity}
                    >
                        <UsersInfos
                            setFieldValue={(key, value) =>
                                setFormFieldsValue(key, value, setFieldValue)
                            }
                            initialData={initialData}
                            currentUser={values}
                            allowSendEmailInvitation={allowSendEmailInvitation}
                        />
                    </div>
                    <div
                        className={
                            tab === 'permissions' ? '' : classes.hiddenOpacity
                        }
                    >
                        <PermissionsSwitches
                            isSuperUser={initialData?.is_superuser}
                            currentUser={values}
                            handleChange={permissions =>
                                setFormFieldsValue(
                                    'user_permissions',
                                    permissions,
                                    setFieldValue,
                                )
                            }
                            setFieldValue={(key, value) =>
                                setFormFieldsValue(key, value, setFieldValue)
                            }
                        />
                    </div>
                    {tab === 'locations' && (
                        <UsersLocations
                            handleChange={ouList =>
                                setFormFieldsValue(
                                    'org_units',
                                    ouList,
                                    setFieldValue,
                                )
                            }
                            currentUser={user}
                        />
                    )}
                </div>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

const modalWithButton = makeFullModal(UserDialogComponent, AddButton);
const modalWithIcon = makeFullModal(UserDialogComponent, EditIconButton);

export { modalWithButton as AddUsersDialog, modalWithIcon as EditUsersDialog };
