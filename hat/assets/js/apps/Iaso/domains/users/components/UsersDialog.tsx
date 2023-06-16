/* eslint-disable camelcase */
import React, {
    useState,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
import { useDispatch } from 'react-redux';
import { Tabs, Tab, makeStyles } from '@material-ui/core';
import {
    IntlMessage,
    useSafeIntl,
    makeFullModal,
    ConfirmCancelModal,
    AddButton,
    IconButton,
} from 'bluesquare-components';

import { MutateFunction } from 'react-query';

import UsersInfos from './UsersInfos';
import { fetchCurrentUser } from '../actions';
import MESSAGES from '../messages';
import UsersLocations from './UsersLocations';
import PermissionsSwitches from './PermissionsSwitches';
import { Profile, useCurrentUser } from '../../../utils/usersUtils';
import { useInitialUser } from './useInitialUser';
import { InitialUserData } from '../types';
import { WarningModal } from './WarningModal/WarningModal';

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

type Props = {
    titleMessage: IntlMessage;
    initialData?: InitialUserData;
    saveProfile: MutateFunction<Profile, any>;
    allowSendEmailInvitation?: boolean;
    forceRefresh: boolean;
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
    forceRefresh = false,
    closeDialog,
}) => {
    const connectedUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();

    const { user, resetUser, setFieldValue, setFieldErrors } =
        useInitialUser(initialData);
    const [tab, setTab] = useState('infos');
    const [openWarning, setOpenWarning] = useState<boolean>(false);
    const [renderCount, setRenderCount] = useState<number>(0);
    const onClosed = () => {
        resetUser();
        setTab('infos');
    };
    const saveUser = useCallback(() => {
        const currentUser: any = {};
        Object.keys(user).forEach(key => {
            currentUser[key] = user[key].value;
        });
        saveProfile(currentUser, {
            onSuccess: () => {
                setTab('infos');
                closeDialog();
                resetUser();
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
    }, [
        connectedUser?.id,
        dispatch,
        resetUser,
        saveProfile,
        setFieldErrors,
        user,
        closeDialog,
    ]);

    const onConfirm = useCallback(() => {
        if (
            (user?.permissions.value ?? []).length > 0 ||
            initialData?.is_superuser
        ) {
            saveUser();
        } else {
            setOpenWarning(true);
        }
    }, [initialData?.is_superuser, saveUser, user?.permissions.value]);
    // Workaround to force the modal to close when saving a new user without permissions.
    // (Because closeDialog cound't be passed to the child WarningModal)
    useEffect(() => {
        if (forceRefresh) {
            setRenderCount(v => v + 1);
        }
    }, [forceRefresh]);
    return (
        <>
            <WarningModal
                open={openWarning}
                closeDialog={() => setOpenWarning(false)}
                onConfirm={saveUser}
            />

            <ConfirmCancelModal
                key={renderCount}
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                maxWidth="sm"
                open={isOpen}
                closeDialog={() => null}
                onClose={() => onClosed()}
                onCancel={() => {
                    closeDialog();
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
            </ConfirmCancelModal>
        </>
    );
};

type PropsIcon = {
    onClick: () => void;
};

export const EditIconButton: FunctionComponent<PropsIcon> = ({ onClick }) => {
    return (
        <IconButton
            onClick={onClick}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};

const modalWithButton = makeFullModal(UserDialogComponent, AddButton);
const modalWithIcon = makeFullModal(UserDialogComponent, EditIconButton);

export { modalWithButton as AddUsersDialog, modalWithIcon as EditUsersDialog };
