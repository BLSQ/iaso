
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { deepEqual } from '../../../utils';
import { MESSAGES } from '../../../utils/constants/filters';


const LOCAL_MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucune',
        id: 'management.none',
    },
});

class UserInfosComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: props.user,
            displayPassword: false,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.user, this.props.user, true)) {
            this.setState({
                user: nextProps.user,
            });
        }
    }

    togglePasswordDisplay() {
        this.setState({
            displayPassword: !this.state.displayPassword,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        const {
            institutions,
            teams,
            password,
            testerTypes,
        } = this.props;
        return (
            <section>
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
                        className={!this.state.user.userName || this.state.user.userName === '' ? 'form-error' : ''}
                        value={this.state.user.userName ? this.state.user.userName : ''}
                        onChange={event => this.props.updateUserField('userName', event.currentTarget.value)}
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
                        value={this.state.user.firstName ? this.state.user.firstName : ''}
                        onChange={event => this.props.updateUserField('firstName', event.currentTarget.value)}
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
                        value={this.state.user.lastName ? this.state.user.lastName : ''}
                        onChange={event => this.props.updateUserField('lastName', event.currentTarget.value)}
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
                        value={this.state.user.phone ? this.state.user.phone : ''}
                        onChange={event => this.props.updateUserField('phone', event.currentTarget.value)}
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
                        value={this.state.user.email ? this.state.user.email : ''}
                        onChange={event => this.props.updateUserField('email', event.currentTarget.value)}
                    />
                </div>
                <div>
                    <label
                        htmlFor="tester_type"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.tester_type"
                            defaultMessage="Type de testeur"
                        />:
                    </label>
                    <Select
                        simpleValue
                        name="tester_type"
                        value={this.state.user.tester_type}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={testerTypes.map(t =>
                            ({ label: formatMessage(MESSAGES[t[0]]), value: t[0] }))}
                        onChange={testerType => this.props.updateUserField('tester_type', testerType)}
                    />
                </div>
                <div className="relative">
                    <label
                        htmlFor="password"
                        className="filter__container__select__label"
                    >
                        {
                            this.state.user.id === 0 &&
                            <FormattedMessage
                                id="main.label.password"
                                defaultMessage="Mot de passe"
                            />
                        }
                        {
                            this.state.user.id !== 0 &&
                            <FormattedMessage
                                id="main.label.newPassword"
                                defaultMessage="Nouveau mot de passe"
                            />
                        }:
                    </label>
                    <input
                        autoComplete="new-password"
                        type={this.state.displayPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        className={(!password || password === '') && this.state.user.id === 0 ? 'form-error' : ''}
                        value={password}
                        onChange={event => this.props.updatePassword(event.currentTarget.value)}
                    />
                    <button className="toggle-display-password" onClick={() => this.togglePasswordDisplay()}>
                        {
                            !this.state.displayPassword &&
                            <i className="fa fa-eye" aria-hidden="true" />
                        }
                        {
                            this.state.displayPassword &&
                            <i className="fa fa-eye-slash" aria-hidden="true" />
                        }
                    </button>
                </div>
                <div>
                    <label
                        htmlFor="teams"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.teams"
                            defaultMessage="Equipe"
                        />:
                    </label>
                    <Select
                        simpleValue
                        name="team_id"
                        value={this.state.user.team}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={teams.map(team =>
                            ({ label: team.name, value: team.id }))}
                        onChange={teamId => this.props.updateUserField('team', teamId)}
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
                        name="institution_id"
                        value={this.state.user.institution ? this.state.user.institution.id : null}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={institutions.map(institution =>
                            ({ label: institution.name, value: institution.id }))}
                        onChange={institutionId => this.props.updateUserField('institution', { id: institutionId })}
                    />
                </div>
                <div>
                    <label
                        htmlFor="passwordReset"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="management.user.resetpassword"
                            defaultMessage="Réinitialiser le mot de passe"
                        />:
                    </label>
                    <input
                        type="checkbox"
                        name="passwordReset"
                        checked={this.state.user.passwordReset ? 'checked' : ''}
                        onChange={event => this.props.updateUserField('passwordReset', event.target.checked)}
                    />
                </div>
            </section>
        );
    }
}

UserInfosComponent.propTypes = {
    user: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    institutions: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    updateUserField: PropTypes.func.isRequired,
    updatePassword: PropTypes.func.isRequired,
    password: PropTypes.string.isRequired,
    testerTypes: PropTypes.array.isRequired,
};

export default injectIntl(UserInfosComponent);
