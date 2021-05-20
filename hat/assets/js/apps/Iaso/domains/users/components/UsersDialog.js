import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { Tabs, Tab, withStyles } from '@material-ui/core';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import UsersInfos from './UsersInfos';
import {
    saveUserProFile as saveUserProFileAction,
    fetchUsersProfiles as fetchUsersProfilesAction,
    createUserProFile as createUserProFileAction,
} from '../actions';
import MESSAGES from '../messages';
import UsersLocations from './UsersLocations';

import PermissionsSwitches from './PermissionsSwitches';
import injectIntl from '../../../libs/intl/injectIntl';

const styles = theme => ({
    tabs: {
        marginBottom: theme.spacing(4),
    },
    tab: {
        padding: 0,
        width: 'calc(100% / 3)',
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
});

class UserDialogComponent extends Component {
    constructor(props) {
        super(props);

        this.state = {
            user: this.initialUser(),
            tab: 'infos',
        };
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.initialData, this.props.initialData)) {
            this.setInitialState();
        }
    }

    handleChangeTab(tab) {
        this.setState({
            tab,
        });
    }

    onConfirm(closeDialog) {
        const {
            params,
            fetchUsersProfiles,
            saveUserProFile,
            createUserProFile,
            initialData,
        } = this.props;
        const currentUser = {};
        Object.keys(this.state.user).forEach(key => {
            currentUser[key] = this.state.user[key].value;
        });

        let saveUser;

        if (initialData) {
            saveUser = saveUserProFile(currentUser);
        } else {
            saveUser = createUserProFile(currentUser);
        }
        saveUser
            .then(() => {
                closeDialog();
                this.handleChangeTab('infos');
                this.setState({
                    user: this.initialUser(),
                });
                fetchUsersProfiles(params);
            })
            .catch(error => {
                if (error.status === 400) {
                    this.setFieldErrors(
                        error.details.errorKey,
                        error.details.errorMessage,
                    );
                }
            });
    }

    onClosed() {
        this.setState({ user: this.initialUser() });
        this.handleChangeTab('infos');
    }

    setFieldValue(fieldName, fieldValue) {
        const { user } = this.state;
        this.setState({
            user: {
                ...user,
                [fieldName]: {
                    value: fieldValue,
                    errors: [],
                },
            },
        });
    }

    setFieldErrors(fieldName, fieldError) {
        const { user } = this.state;
        this.setState({
            user: {
                ...user,
                [fieldName]: {
                    value: user[fieldName].value,
                    errors: [fieldError],
                },
            },
        });
    }

    setInitialState() {
        this.setState({
            user: this.initialUser(),
        });
    }

    initialUser(profile) {
        let initialData = this.props.initialData ? this.props.initialData : {};
        if (profile) {
            initialData = profile;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            user_name: { value: get(initialData, 'user_name', ''), errors: [] },
            first_name: {
                value: get(initialData, 'first_name', ''),
                errors: [],
            },
            last_name: { value: get(initialData, 'last_name', ''), errors: [] },
            email: { value: get(initialData, 'email', ''), errors: [] },
            password: { value: '', errors: [] },
            permissions: {
                value: get(initialData, 'permissions', []),
                errors: [],
            },
            org_units: { value: get(initialData, 'org_units', []), errors: [] },
        };
    }

    render() {
        const {
            titleMessage,
            renderTrigger,
            initialData,
            classes,
            intl: { formatMessage },
        } = this.props;
        const { user, tab } = this.state;
        return (
            <ConfirmCancelDialogComponent
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                onClosed={() => this.onClosed()}
                renderTrigger={renderTrigger}
                maxWidth="xs"
                dialogProps={{
                    classNames: classes.dialog,
                }}
            >
                <Tabs
                    value={tab}
                    classes={{
                        root: classes.tabs,
                    }}
                    onChange={(event, newtab) => this.handleChangeTab(newtab)}
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
                <div className={classes.root}>
                    {tab === 'infos' && (
                        <UsersInfos
                            setFieldValue={(key, value) =>
                                this.setFieldValue(key, value)
                            }
                            initialData={initialData}
                            currentUser={user}
                        />
                    )}
                    <div
                        className={
                            tab === 'permissions' ? '' : classes.hiddenOpacity
                        }
                    >
                        <PermissionsSwitches
                            isSuperUser={
                                initialData && initialData.is_superuser
                            }
                            currentUser={user}
                            handleChange={permissions =>
                                this.setFieldValue('permissions', permissions)
                            }
                        />
                    </div>
                    {tab === 'locations' && (
                        <UsersLocations
                            handleChange={ouList =>
                                this.setFieldValue('org_units', ouList)
                            }
                            currentUser={user}
                        />
                    )}
                </div>
            </ConfirmCancelDialogComponent>
        );
    }
}

UserDialogComponent.defaultProps = {
    initialData: null,
};

UserDialogComponent.propTypes = {
    titleMessage: PropTypes.object.isRequired,
    renderTrigger: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    fetchUsersProfiles: PropTypes.func.isRequired,
    saveUserProFile: PropTypes.func.isRequired,
    createUserProFile: PropTypes.func.isRequired,
    params: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    profiles: state.users.list,
    count: state.users.count,
    pages: state.users.pages,
    fetching: state.users.fetching,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchUsersProfiles: fetchUsersProfilesAction,
            saveUserProFile: saveUserProFileAction,
            createUserProFile: createUserProFileAction,
        },
        dispatch,
    ),
});
export default withStyles(styles)(
    connect(
        MapStateToProps,
        mapDispatchToProps,
    )(injectIntl(UserDialogComponent)),
);
