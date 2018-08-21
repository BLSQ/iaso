
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import Switch from 'react-switch';


class UserPermissionsComponent extends Component {
    constructor(props) {
        super(props);
        const { permissions, userPermissions } = props;
        this.state = {
            permissions,
            userPermissions,
        };
    }

    componentWillReceiveProps(nextProps) {
        const { permissions, userPermissions } = nextProps;
        this.setState({
            permissions,
            userPermissions,
        });
    }

    onChange(permissionId) {
        const permissionIndex = this.state.userPermissions.indexOf(permissionId);
        const newUserPermissions = this.state.userPermissions;
        if (permissionIndex === -1) {
            newUserPermissions.push(permissionId);
        } else {
            newUserPermissions.splice(permissionIndex, 1);
        }
        this.props.updatePermissions(newUserPermissions);
    }

    render() {
        const { permissions, userPermissions } = this.state;
        return (
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
        );
    }
}

UserPermissionsComponent.propTypes = {
    permissions: PropTypes.array.isRequired,
    userPermissions: PropTypes.array.isRequired,
    updatePermissions: PropTypes.func.isRequired,
};

export default injectIntl(UserPermissionsComponent);
