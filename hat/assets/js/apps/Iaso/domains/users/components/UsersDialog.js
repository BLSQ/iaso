import React, { Component } from 'react';
import get from 'lodash/get';
import isEqual from 'lodash/isEqual';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import { bindActionCreators } from 'redux';

import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../components/forms/InputComponent';
import PermissionsSwitches from './PermissionsSwitches';

import {
    saveUserProFile as saveUserProFileAction,
    fetchUsersProfiles as fetchUsersProfilesAction,
    createUserProFile as createUserProFileAction,
} from '../actions';

class UserDialogComponent extends Component {
    constructor(props) {
        super(props);

        this.state = this.initialState();
    }

    componentDidUpdate(prevProps) {
        if (!isEqual(prevProps.initialData, this.props.initialData)) {
            this.setInitialState();
        }
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
        Object.keys(this.state).forEach((key) => {
            currentUser[key] = this.state[key].value;
        });

        let saveUser;

        if (initialData) {
            saveUser = saveUserProFile(currentUser);
        } else {
            saveUser = createUserProFile(currentUser);
        }
        saveUser.then((newProfile) => {
            closeDialog();
            this.setState(this.initialState(newProfile));
            fetchUsersProfiles(params);
        })
            .catch((error) => {
                console.log('error', error);
                if (error.status === 400) {
                    this.setFieldErrors(error.details.errorKey, error.details.errorMessage);
                }
            });
    }

    setFieldValue(fieldName, fieldValue) {
        this.setState({ [fieldName]: { value: fieldValue, errors: [] } });
    }

    setFieldErrors(fieldName, fieldError) {
        this.setState({ [fieldName]: { value: this.state[fieldName].value, errors: [fieldError] } });
    }

    setInitialState() {
        this.setState(this.initialState());
    }

    initialState(profile) {
        let initialData = this.props.initialData ? this.props.initialData : {};
        if (profile) {
            initialData = profile;
        }
        return {
            id: { value: get(initialData, 'id', null), errors: [] },
            user_name: { value: get(initialData, 'user_name', ''), errors: [] },
            first_name: { value: get(initialData, 'first_name', ''), errors: [] },
            last_name: { value: get(initialData, 'last_name', ''), errors: [] },
            email: { value: get(initialData, 'email', ''), errors: [] },
            permissions: { value: get(initialData, 'permissions', []), errors: [] },
        };
    }

    render() {
        const {
            titleMessage, renderTrigger, initialData,
        } = this.props;
        return (
            <ConfirmCancelDialogComponent
                titleMessage={titleMessage}
                onConfirm={closeDialog => this.onConfirm(closeDialog)}
                cancelMessage={{ id: 'iaso.label.cancel', defaultMessage: 'Cancel' }}
                confirmMessage={{ id: 'iaso.label.save', defaultMessage: 'Save' }}
                onClosed={() => this.setState(this.initialState())}
                renderTrigger={renderTrigger}
                maxWidth="md"
            >
                <Grid container spacing={4} justify="flex-start">
                    <Grid xs={6} item>
                        <InputComponent
                            keyValue="user_name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.user_name.value}
                            errors={this.state.user_name.errors}
                            type="text"
                            label={{
                                defaultMessage: 'User name',
                                id: 'iaso.label.userName',
                            }}
                            required
                        />
                        <InputComponent
                            keyValue="first_name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.first_name.value}
                            errors={this.state.first_name.errors}
                            type="text"
                            label={{
                                defaultMessage: 'First name',
                                id: 'iaso.label.firstName',
                            }}
                        />
                        <InputComponent
                            keyValue="last_name"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.last_name.value}
                            errors={this.state.last_name.errors}
                            type="text"
                            label={{
                                defaultMessage: 'Last name',
                                id: 'iaso.label.lastName',
                            }}
                        />
                        <InputComponent
                            keyValue="email"
                            onChange={(key, value) => this.setFieldValue(key, value)}
                            value={this.state.email.value}
                            errors={this.state.email.errors}
                            type="email"
                            label={{
                                defaultMessage: 'Email',
                                id: 'iaso.label.email',
                            }}
                        />
                    </Grid>
                    <Grid xs={6} item>
                        <PermissionsSwitches isSuperUser={initialData && initialData.is_superuser} currentUser={this.state} handleChange={permissions => this.setFieldValue('permissions', permissions)} />
                    </Grid>
                </Grid>
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
};


const MapStateToProps = state => ({
    profiles: state.users.list,
    count: state.users.count,
    pages: state.users.pages,
    fetching: state.users.fetching,
});

const mapDispatchToProps = dispatch => (
    {
        ...bindActionCreators({
            fetchUsersProfiles: fetchUsersProfilesAction,
            saveUserProFile: saveUserProFileAction,
            createUserProFile: createUserProFileAction,
        }, dispatch),
    }
);
export default connect(MapStateToProps, mapDispatchToProps)(UserDialogComponent);
