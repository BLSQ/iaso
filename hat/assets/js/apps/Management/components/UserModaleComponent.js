import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import Select from 'react-select';
import ReactModal from 'react-modal';
import TabsComponent from '../../../components/TabsComponent';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucune',
        id: 'management.none',
    },
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
        let newInstitutionId = null;
        if (this.props.user.institution) {
            if (parseInt(this.props.user.institution[0], 10)) {
                [newInstitutionId] = this.props.user.institution;
            } else {
                [, newInstitutionId] = this.props.user.institution;
            }
        }
        if (this.props.user.province) {
            this.props.selectProvince(this.props.user.province);
        }
        if (this.props.user.zone) {
            this.props.selectZone(this.props.user.zone);
        }
        this.setState({
            showModale: this.props.showModale,
            user: {
                id: this.props.user.id,
                firstName: this.props.user.firstName ? this.props.user.firstName : '',
                userName: this.props.user.userName ? this.props.user.userName : '',
                lastName: this.props.user.lastName ? this.props.user.lastName : '',
                phone: this.props.user.phone ? this.props.user.phone : '',
                email: this.props.user.email ? this.props.user.email : '',
                institution: this.props.user.institution ? this.props.user.institution : null,
                province: this.props.user.province ? this.props.user.province : null,
                zone: this.props.user.zone ? this.props.user.zone : null,
                area: this.props.user.area ? this.props.user.area : null,
                institutionId: newInstitutionId,
            },
            password: '',
        });
    }

    componentDidMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.user.zone && nextProps.user.zone.length > 0 && nextProps.zones.length > 0) {
            console.log('ici');
            const newUser = Object.assign({}, this.state.user, { zone: nextProps.user.zone });
            this.setState({
                user: newUser,
            });
        }
        if (nextProps.user.area && nextProps.user.area.length > 0 && nextProps.areas.length > 0) {
            const newUser = Object.assign({}, this.state.user, { zone: nextProps.user.area });
            this.setState({
                user: newUser,
            });
        }
    }

    componentWillUnmount() {
        this.props.selectProvince([]);
        this.setState({
            showModale: false,
            user: {
                id: 0,
                firstName: '',
                userName: '',
                lastName: '',
                phone: '',
                email: '',
                institution: null,
                province: null,
                zone: null,
                area: null,
                institutionId: null,
            },
            password: '',
        });
    }

    updateUserField(key, value) {
        const newUser = Object.assign({}, this.state.user, { [key]: value });
        if (key === 'institution') {
            newUser.institutionId = value.id;
        }
        if (key === 'province') {
            this.props.selectProvince(value);
        }
        if (key === 'zone') {
            this.props.selectZone(value);
        }
        this.setState({
            user: newUser,
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
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
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
                    <section className={this.state.currentTab === 'infos' ? '' : 'hidden'}>
                        <div>
                            <label
                                htmlFor="userName"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.userName"
                                    defaultMessage="Nom d'utilisateur"
                                />:
                            </label>
                            <input
                                type="text"
                                name="userName"
                                id="userName"
                                value={this.state.user.userName}
                                onChange={event => this.updateUserField('userName', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="firstName"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.firstName"
                                    defaultMessage="Prénom"
                                />:
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                id="firstName"
                                value={this.state.user.firstName}
                                onChange={event => this.updateUserField('firstName', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="lastName"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.lastName"
                                    defaultMessage="Nom"
                                />:
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                id="lastName"
                                value={this.state.user.lastName}
                                onChange={event => this.updateUserField('lastName', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="phone"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.phone"
                                    defaultMessage="Téléphone"
                                />:
                            </label>
                            <input
                                type="text"
                                name="phone"
                                id="phone"
                                value={this.state.user.phone}
                                onChange={event => this.updateUserField('phone', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.email"
                                    defaultMessage="Email"
                                />:
                            </label>
                            <input
                                type="text"
                                name="email"
                                id="email"
                                value={this.state.user.email}
                                onChange={event => this.updateUserField('email', event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.password"
                                    defaultMessage="Nouveau mot de passe"
                                />:
                            </label>
                            <input
                                autoComplete="new-password"
                                type="password"
                                name="password"
                                id="password"
                                value={this.state.password}
                                onChange={event => this.updatePassword(event.currentTarget.value)}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="institution"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.institution"
                                    defaultMessage="Institution"
                                />:
                            </label>
                            <Select
                                simpleValue
                                name="coordination_id"
                                value={this.state.user.institutionId}
                                placeholder={formatMessage(MESSAGES.none)}
                                options={this.props.institutions.map(institution =>
                                    ({ label: institution.name, value: institution.id }))}
                                onChange={institutionId => this.updateUserField('institution', { id: institutionId })}
                            />
                        </div>
                    </section>
                    <section className={this.state.currentTab === 'geo' ? '' : 'hidden'}>
                        <div>
                            <label
                                htmlFor="province"
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="main.label.province"
                                    defaultMessage="Province"
                                />:
                            </label>
                            <Select
                                multi
                                simpleValue
                                name="provinceId"
                                value={this.state.user.province ? this.state.user.province : null}
                                placeholder={formatMessage(MESSAGES.none)}
                                options={this.props.provinces.map(province =>
                                    ({ label: province.name, value: province.id }))}
                                onChange={provincesId => this.updateUserField('province', provincesId)}
                            />
                        </div>
                        {
                            this.props.zones.length > 0 &&
                            <div>
                                <label
                                    htmlFor="zones"
                                    className="filter__container__select__label"
                                >
                                    <FormattedMessage
                                        id="main.label.zones"
                                        defaultMessage="Zones"
                                    />:
                                </label>
                                <Select
                                    multi
                                    simpleValue
                                    name="zoneIds"
                                    value={this.state.user.zone ? this.state.user.zone : null}
                                    placeholder={formatMessage(MESSAGES.none)}
                                    options={this.props.zones.map(zone =>
                                        ({ label: zone.name, value: zone.id }))}
                                    onChange={zoneIds => this.updateUserField('zone', zoneIds)}
                                />
                            </div>
                        }
                        {
                            this.props.areas.length > 0 &&
                            <div>
                                <label
                                    htmlFor="areas"
                                    className="filter__container__select__label"
                                >
                                    <FormattedMessage
                                        id="main.label.areas"
                                        defaultMessage="Aires"
                                    />:
                                </label>
                                <Select
                                    multi
                                    simpleValue
                                    name="areaIds"
                                    value={this.state.user.area ? this.state.user.area : null}
                                    placeholder={formatMessage(MESSAGES.none)}
                                    options={this.props.areas.map(area =>
                                        ({ label: area.name, value: area.id }))}
                                    onChange={areaIds => this.updateUserField('area', areaIds)}
                                />
                            </div>
                        }
                    </section>
                    <section className={this.state.currentTab === 'permissions' ? '' : 'hidden'}>
                        permissions
                    </section>
                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.cancel" defaultMessage="Annuler" />
                        </button>
                        <button
                            disabled={
                                (this.state.user.userName === '' ||
                                    (!this.state.isChanged && this.state.user.id !== 0) ||
                                    (this.state.user.id === 0 &&
                                        (this.state.user.email === '' || this.state.user.userName === '' || this.state.password === '')))
                            }
                            className="button--save"
                            onClick={() => this.props.saveData(this.state.user)}
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
        firstName: '',
    },
};
UserModale.propTypes = {
    intl: PropTypes.object.isRequired,
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    user: PropTypes.object,
    saveData: PropTypes.func.isRequired,
    institutions: PropTypes.array.isRequired,
    provinces: PropTypes.array.isRequired,
    zones: PropTypes.array.isRequired,
    areas: PropTypes.array.isRequired,
    selectProvince: PropTypes.func.isRequired,
    selectZone: PropTypes.func.isRequired,
};

export default injectIntl(UserModale);
