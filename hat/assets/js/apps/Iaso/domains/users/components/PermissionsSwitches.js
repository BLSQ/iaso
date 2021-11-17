import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import {
    withStyles,
    FormControlLabel,
    Switch,
    Typography,
} from '@material-ui/core';

import { fetchPermissions as fetchPermissionsAction } from '../actions';

import MESSAGES from '../messages';

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
});

class PermissionsSwitches extends Component {
    componentDidMount() {
        const { fetchPermissions, permissions } = this.props;
        if (permissions.length === 0) {
            fetchPermissions();
        }
    }

    setPermissions(codeName, isChecked) {
        const { currentUser, handleChange } = this.props;
        const newUserPerms = [...currentUser.permissions.value];
        if (!isChecked) {
            const permIndex = newUserPerms.indexOf(codeName);
            newUserPerms.splice(permIndex, 1);
        } else {
            newUserPerms.push(codeName);
        }
        handleChange(newUserPerms);
    }

    // We need the intl object inside the component to be able to perform sort the strings
    // as <FormattedMessage/> returns a span, not a string
    permissionLabel(permissionCodeName) {
        const { intl } = this.props;
        return MESSAGES[permissionCodeName]
            ? intl.formatMessage(MESSAGES[permissionCodeName])
            : permissionCodeName;
    }

    render() {
        const { classes, permissions, currentUser, isSuperUser } = this.props;
        return (
            <>
                {isSuperUser && (
                    <Typography variant="body1" className={classes.admin}>
                        {this.props.intl.formatMessage(MESSAGES.isSuperUser)}
                    </Typography>
                )}
                {!isSuperUser &&
                    permissions
                        .sort((a, b) =>
                            this.permissionLabel(a.codename).localeCompare(
                                this.permissionLabel(b.codename),
                            ),
                        )
                        .map(p => (
                            <div key={p.id}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={Boolean(
                                                currentUser.permissions.value.find(
                                                    up => up === p.codename,
                                                ),
                                            )}
                                            onChange={e =>
                                                this.setPermissions(
                                                    p.codename,
                                                    e.target.checked,
                                                )
                                            }
                                            name={p.codename}
                                            color="primary"
                                        />
                                    }
                                    label={this.permissionLabel(p.codename)}
                                />
                            </div>
                        ))}
            </>
        );
    }
}

PermissionsSwitches.defaultProps = {
    isSuperUser: false,
};

PermissionsSwitches.propTypes = {
    classes: PropTypes.object.isRequired,
    fetchPermissions: PropTypes.func.isRequired,
    permissions: PropTypes.array.isRequired,
    currentUser: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    isSuperUser: PropTypes.bool,
    intl: PropTypes.object.isRequired,
};

const MapStateToProps = state => ({
    permissions: state.users.permissions,
});

const mapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchPermissions: fetchPermissionsAction,
        },
        dispatch,
    ),
});

export default injectIntl(
    withStyles(styles)(
        connect(MapStateToProps, mapDispatchToProps)(PermissionsSwitches),
    ),
);
