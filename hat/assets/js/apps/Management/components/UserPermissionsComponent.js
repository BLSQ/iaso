
import React, { Component, Fragment } from 'react';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';
import Switch from 'react-switch';
import { connect } from 'react-redux';

import PropTypes from 'prop-types';

import { userActions } from '../redux/users';
import DeleteModaleComponent from '../components/DeleteModaleComponent';

const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'None',
        id: 'main.label.noneFem',
    },
});

const getUserType = (userPermissions, userTypes) => {
    let userType;
    userTypes.forEach((t) => {
        if (t.permissions.length === userPermissions.length && !userType) {
            userType = t;
            t.permissions.forEach((p) => {
                const hasPermission = Boolean(userPermissions.find(perm => perm === p));
                if (!hasPermission) {
                    userType = undefined;
                }
            });
        }
    });
    return userType;
};

class UserPermissionsComponent extends Component {
    constructor(props) {
        super(props);
        const { permissions, userPermissions, userType } = props;
        this.state = {
            userType,
            permissions,
            userPermissions,
            isAddingUserType: false,
            newUserType: '',
            userTypeAlreadyExist: false,
            errorOnSaveUserType: false,
            showDeleteModale: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        const { permissions, userPermissions, userType } = nextProps;
        this.setState({
            userType,
            permissions,
            userPermissions,
        });
    }

    onChange(permissionId) {
        const permissionIndex = this.state.userPermissions.indexOf(permissionId);
        const newUserPermissions = this.state.userPermissions.slice();
        if (permissionIndex === -1) {
            newUserPermissions.push(permissionId);
        } else {
            newUserPermissions.splice(permissionIndex, 1);
        }
        const userType = getUserType(newUserPermissions, this.props.userTypes);
        this.props.updatePermissions(newUserPermissions, userType);
    }

    onChangeUserType(userTypeId) {
        let newUserPermissions = [];
        let userType;
        if (userTypeId) {
            [userType] = this.props.userTypes.filter(userTypeItem => userTypeItem.id === parseInt(userTypeId, 10));
            newUserPermissions = userType.permissions;
        }
        this.props.updatePermissions(newUserPermissions, userType);
    }

    onSaveUserType() {
        const {
            userPermissions,
            newUserType,
        } = this.state;
        this.props.createUserType(newUserType, userPermissions, this);
    }

    toggleAddUserType(isAddingUserType) {
        this.setState({
            isAddingUserType,
            newUserType: '',
            errorOnSaveUserType: false,
        });
    }

    errorOnSaveUserType(errorOnSaveUserType) {
        this.setState({
            errorOnSaveUserType,
        });
    }

    updateNewUserType(newUserType) {
        const { userTypes } = this.props;
        const userTypeAlreadyExist = Boolean(userTypes.find(t => t.name === newUserType));
        this.setState({
            newUserType,
            userTypeAlreadyExist,
        });
    }

    toggleDeleteModale() {
        this.setState({
            showDeleteModale: !this.state.showDeleteModale,
        });
    }

    render() {
        const {
            intl: {
                formatMessage,
            },
            userTypes,
            deleteUserType,
        } = this.props;
        const {
            permissions,
            userPermissions,
            isAddingUserType,
            userTypeAlreadyExist,
            userType,
            newUserType,
            errorOnSaveUserType,
        } = this.state;
        return (
            <section className="permission-tabs">
                {
                    this.state.showDeleteModale &&
                    <DeleteModaleComponent
                        showModale={this.state.showDeleteModale}
                        toggleModal={() => this.toggleDeleteModale()}
                        element={userType}
                        deleteElement={() => {
                            this.toggleDeleteModale();
                            deleteUserType(userType.id, this);
                        }}
                    />
                }
                <div className="permission-select-user-type">
                    <label
                        htmlFor="userType"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.userType"
                            defaultMessage="User type"
                        />:
                    </label>
                    {
                        !isAddingUserType &&
                        <Select
                            simpleValue
                            name="userType"
                            value={userType ? userType.id : null}
                            placeholder={formatMessage(MESSAGES.none)}
                            options={userTypes.map(t =>
                                ({
                                    label: t.name,
                                    value: t.id,
                                }))}
                            onChange={userTypeId => this.onChangeUserType(userTypeId)}
                        />
                    }
                    {
                        isAddingUserType &&
                        <div>
                            <input
                                type="text"
                                name="user-type"
                                id="user-type"
                                className={`permission-select-user-type__input${userTypeAlreadyExist ? ' form-error' : ''}`}
                                value={newUserType}
                                onChange={event => this.updateNewUserType(event.currentTarget.value)}
                            />
                            {
                                userTypeAlreadyExist &&
                                <span className="permission-select-user-type__error error-text">
                                    <FormattedMessage
                                        id="management.userType.label.userTypeAlreadyExist"
                                        defaultMessage="Ce type de rôle existe déjà"
                                    />
                                </span>
                            }
                            {
                                errorOnSaveUserType &&
                                <span className="permission-select-user-type__error error-text">
                                    <FormattedMessage
                                        id="management.userType.label.errorOnSaveUserType"
                                        defaultMessage="Une erreur est survenue lors de la sauvegarde"
                                    />
                                </span>
                            }
                        </div>
                    }
                </div>
                <div className="permission-add-user-type">
                    {
                        !isAddingUserType &&
                        <Fragment>
                            <button
                                disabled={!userType}
                                className="button--delete--tiny margin-right--tiny"
                                onClick={() => this.toggleDeleteModale()}
                            >
                                <i className="fa fa-trash" />
                                <FormattedMessage id="management.userType.label.delete" defaultMessage="Delete this role" />
                            </button>
                            <button
                                disabled={Boolean(userType) || userPermissions.length === 0}
                                className="button--tiny"
                                onClick={() => this.toggleAddUserType(true)}
                            >
                                <i className="fa fa-plus" />
                                <FormattedMessage id="management.userType.label.add" defaultMessage="Add this role" />
                            </button>
                        </Fragment>
                    }
                    {
                        isAddingUserType &&
                        <Fragment>
                            <button
                                className="button--tiny margin-right--tiny"
                                onClick={() => this.toggleAddUserType(false)}
                            >
                                <FormattedMessage id="main.label.cancel" defaultMessage="Cancel" />
                            </button>
                            <button
                                disabled={newUserType === ''}
                                className="button--tiny"
                                onClick={() => this.onSaveUserType()}
                            >
                                <i className="fa fa-save" />
                                <FormattedMessage id="main.label.save" defaultMessage="Save" />
                            </button>
                        </Fragment>
                    }
                </div>
                <section className="permission-container">
                    {
                        permissions.map(permission => (
                            <div key={permission.id} className="permission-item">
                                <div className="permission-label">{permission.name}</div>
                                <div className="permission-button">
                                    <Switch
                                        onChange={() => this.onChange(permission.id)}
                                        checked={userPermissions.indexOf(permission.id) !== -1}
                                        onColor="#86d3ff"
                                        onHandleColor="#2693e6"
                                        handleDiameter={30}
                                        uncheckedIcon={false}
                                        checkedIcon={false}
                                        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                                        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                                    />
                                </div>
                            </div>
                        ))
                    }
                </section>
            </section>
        );
    }
}

UserPermissionsComponent.defaultProps = {
    userType: null,
};


UserPermissionsComponent.propTypes = {
    userType: PropTypes.object,
    intl: PropTypes.object.isRequired,
    userTypes: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    userPermissions: PropTypes.array.isRequired,
    updatePermissions: PropTypes.func.isRequired,
    createUserType: PropTypes.func.isRequired,
    deleteUserType: PropTypes.func.isRequired,
};


const MapStateToProps = () => ({});

const MapDispatchToProps = dispatch => ({
    dispatch,
    createUserType: (userType, permissions, component) => dispatch(userActions.createUserType(dispatch, userType, permissions, component)),
    deleteUserType: (userTypeId, component) => dispatch(userActions.deleteUserType(dispatch, userTypeId, component)),
});

export default connect(MapStateToProps, MapDispatchToProps)(injectIntl(UserPermissionsComponent));
