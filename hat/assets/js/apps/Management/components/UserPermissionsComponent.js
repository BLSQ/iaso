
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';

import Switch from 'react-switch';

const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'management.none.masc',
    },
});
class UserPermissionsComponent extends Component {
    constructor(props) {
        super(props);
        const { permissions, userPermissions, userType } = props;
        this.state = {
            userType,
            permissions,
            userPermissions,
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
        this.props.updatePermissions(newUserPermissions);
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

    render() {
        const { formatMessage } = this.props.intl;
        const { permissions, userPermissions } = this.state;
        return (
            <section className="permission-tabs">
                <div>
                    <label
                        htmlFor="userType"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.userType"
                            defaultMessage="Type de rôle"
                        />:
                    </label>
                    <Select
                        simpleValue
                        name="userType"
                        value={this.state.userType ? this.state.userType.id : null}
                        placeholder={formatMessage(MESSAGES.none)}
                        options={this.props.userTypes.map(userType =>
                            ({ label: userType.name, value: userType.id }))}
                        onChange={userTypeId => this.onChangeUserType(userTypeId)}
                    />
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
};

export default injectIntl(UserPermissionsComponent);
