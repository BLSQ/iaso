import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import TabsComponent from '../../../components/TabsComponent';
import { deepEqual } from '../../../utils';
import UserInfosComponent from './UserInfosComponent';
import UserGeoComponent from './UserGeoComponent';
import UserPermissionsComponent from './UserPermissionsComponent';


const MESSAGES = defineMessages({
    infos: {
        defaultMessage: 'Informations',
        id: 'main.label.informations',
    },
    geo: {
        defaultMessage: 'Regions',
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
            isUpdated: false,
            error: null,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
        if (this.props.user.province) {
            this.props.selectProvince(this.props.user.province, this.props.user.ZS);
        }
    }

    componentWillReceiveProps(nextProps) {
        let newState = {};
        if (nextProps.isUpdated) {
            newState.isUpdated = nextProps.isUpdated;
            newState.error = false;
            setTimeout(() => {
                this.setState({
                    isUpdated: false,
                });
            }, 10000);
        }
        if (!deepEqual(nextProps.user, this.props.user, true)) {
            newState.user = nextProps.user;
        } else if (nextProps.error) {
            newState = {
                error: nextProps.error,
                isUpdated: false,
                isChanged: true,
            };
            setTimeout(() => {
                this.setState({
                    error: null,
                });
            }, 10000);
        }
        this.setState(newState);
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

    updatePermissions(permissions, userType) {
        const newUser = Object.assign({}, this.state.user, {
            userType,
            permissions,
        });
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
        const {
            intl: {
                formatMessage,
            },
            institutions,
            coordinations,
            userTypes,
            userLevels,
            provinces,
            teams,
            zones,
            areas,
            permissions,
            testerTypes,
            screeningTypes,
        } = this.props;

        const {
            currentTab,
            showModale,
            password,
            user,
            isUpdated,
            error,
            isChanged,
        } = this.state;
        return (
            <ReactModal
                isOpen={showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.closeModal()}
                className="with-tabs"
            >
                <section className="edit-modal large user-modale">
                    <TabsComponent
                        selectTab={key => (this.setState({ currentTab: key }))}
                        isRedirecting={false}
                        currentTab={currentTab}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.geo), key: 'geo' },
                            { label: formatMessage(MESSAGES.permissions), key: 'permissions' },
                        ]}
                        defaultSelect={currentTab}
                    />
                    {
                        currentTab === 'infos'
                        && (
                            <UserInfosComponent
                                password={password}
                                institutions={institutions}
                                coordinations={coordinations}
                                teams={teams}
                                user={user}
                                updatePassword={newPassword => this.updatePassword(newPassword)}
                                updateUserField={(key, value) => this.updateUserField(key, value)}
                                testerTypes={testerTypes}
                                screeningTypes={screeningTypes}
                                userLevels={userLevels}
                            />
                        )
                    }
                    {
                        currentTab === 'geo'
                        && (
                            <UserGeoComponent
                                provinces={provinces}
                                zones={zones}
                                areas={areas}
                                user={user}
                                updateUserField={(key, value) => this.updateUserField(key, value)}
                            />
                        )
                    }
                    {
                        currentTab === 'permissions'
                        && (
                            <UserPermissionsComponent
                                userTypes={userTypes}
                                permissions={permissions}
                                userPermissions={user.permissions}
                                userType={user.userType}
                                updatePermissions={(newPermissions, newUserType) => this.updatePermissions(newPermissions, newUserType)}
                            />
                        )
                    }
                    {
                        isUpdated
                        && (
                            <div className="align-right text--success">
                                <FormattedMessage id="main.label.userupdated" defaultMessage="Utilisateur sauvegardé" />
                            </div>
                        )
                    }
                    {
                        error
                        && (
                            <div className="align-right text--error">
                                {
                                    error.message
                                    || <FormattedMessage id="main.label.error" defaultMessage="Une erreur est survenue lors de la sauvegarde" />
                                }
                            </div>
                        )
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
                                (user.userName === ''
                                    || (!isChanged && user.id !== 0)
                                    || (user.id === 0
                                        && (user.userName === '' || password === '')))
                            }
                            className="button--save"
                            onClick={() => this.onSave()}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="main.label.save" defaultMessage="Save" />
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
    error: null,
};
UserModale.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    user: PropTypes.object,
    saveData: PropTypes.func.isRequired,
    institutions: PropTypes.array.isRequired,
    coordinations: PropTypes.array.isRequired,
    userTypes: PropTypes.array.isRequired,
    testerTypes: PropTypes.array.isRequired,
    userLevels: PropTypes.array.isRequired,
    permissions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
    updateCurrentUser: PropTypes.func.isRequired,
    isUpdated: PropTypes.bool.isRequired,
    error: PropTypes.any,
    screeningTypes: PropTypes.array.isRequired,
};

export default injectIntl(UserModale);
