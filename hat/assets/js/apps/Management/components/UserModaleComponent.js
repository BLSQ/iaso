import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import TabsComponent from '../../../components/TabsComponent';
import { deepEqual } from '../../../utils';
import UserInfosComponent from '../components/UserInfosComponent';
import UserGeoComponent from '../components/UserGeoComponent';
import UserPermissionsComponent from './UserPermissionsComponent';


const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Informations',
        id: 'management.infos',
    },
    geo: {
        defaultMessage: 'Régions',
        id: 'management.geo',
    },
    permissions: {
        defaultMessage: 'Permissions',
        id: 'management.permissions',
    },
});

class UserModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            user: props.user,
            password: '',
            isChanged: false,
            currentTab: 'infos',
        };
    }

    componentWillMount() {
        if (this.props.user.province) {
            this.props.selectProvince(this.props.user.province, this.props.user.ZS);
        }
    }

    componentDidMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.user, this.props.user, true)) {
            this.setState({
                user: nextProps.user,
            });
        }
    }

    onSave() {
        this.setState({
            isChanged: false,
        });
        this.props.saveData(this.state.user);
    }

    updateUserField(key, value) {
        const newUser = Object.assign({}, this.state.user, { [key]: value });
        if (key === 'province') {
            this.props.selectProvince(value);
            if (value.length === 0) {
                newUser.ZS = [];
                newUser.AS = [];
            }
        }
        if (key === 'ZS') {
            this.props.selectZone(value);
            if (value.length === 0) {
                newUser.AS = [];
            }
        }
        this.props.updateCurrentUser(newUser);
        this.setState({
            isChanged: true,
        });
    }

    updatePassword(password) {
        this.setState({
            password,
            user: {
                ...this.state.user,
                password,
            },
            isChanged: true,
        });
    }

    render() {
        const { formatMessage } = this.props.intl;
        const {
            institutions,
            provinces,
            zones,
            areas,
            permissions,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
                className="with-tabs"
            >
                <section className="edit-modal large">
                    <TabsComponent
                        selectTab={key => (this.setState({ currentTab: key }))}
                        isRedirecting={false}
                        currentTab={this.state.currentTab}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.geo), key: 'geo' },
                            { label: formatMessage(MESSAGES.permissions), key: 'permissions' },
                        ]}
                        defaultSelect={this.state.currentTab}
                    />
                    {
                        this.state.currentTab === 'infos' &&
                        <UserInfosComponent
                            password={this.state.password}
                            institutions={institutions}
                            user={this.state.user}
                            updatePassword={password => this.updatePassword(password)}
                            updateUserField={(key, value) => this.updateUserField(key, value)}
                        />
                    }
                    {
                        this.state.currentTab === 'geo' &&
                        <UserGeoComponent
                            provinces={provinces}
                            zones={zones}
                            areas={areas}
                            user={this.state.user}
                            updateUserField={(key, value) => this.updateUserField(key, value)}
                        />
                    }
                    {
                        this.state.currentTab === 'permissions' &&
                        <UserPermissionsComponent
                            permissions={permissions}
                            userPermissions={this.state.user.permissions}
                            updatePermissions={newPermissions => this.updateUserField('permissions', newPermissions)}
                        />
                    }
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.closeModal()}
                        >
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={
                                (this.state.user.userName === '' ||
                                    (!this.state.isChanged && this.state.user.id !== 0) ||
                                    (this.state.user.id === 0 &&
                                        (this.state.user.email === '' || this.state.user.userName === '' || this.state.password === '')))
                            }
                            className="button--save"
                            onClick={() => this.onSave()}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveUser" defaultMessage="Sauvegarder l'utilisateur" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
UserModale.defaultProps = {
    user: {
        id: 0,
    },
};
UserModale.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    user: PropTypes.object,
    saveData: PropTypes.func.isRequired,
    institutions: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    updateCurrentUser: PropTypes.func.isRequired,
};

export default injectIntl(UserModale);
