
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { deepEqual } from '../../../utils';


const MESSAGES = defineMessages({
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
        };
    }

    componentWillReceiveProps(nextProps) {
        if (!deepEqual(nextProps.user, this.props.user, true)) {
            this.setState({
                user: nextProps.user,
            });
        }
    }


    render() {
        const { formatMessage } = this.props.intl;
        const {
            institutions,
            teams,
            password,
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
                        value={password}
                        onChange={event => this.props.updatePassword(event.currentTarget.value)}
                    />
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
                        placeholder={formatMessage(MESSAGES.none)}
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
                        placeholder={formatMessage(MESSAGES.none)}
                        options={institutions.map(institution =>
                            ({ label: institution.name, value: institution.id }))}
                        onChange={institutionId => this.props.updateUserField('institution', { id: institutionId })}
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
};

export default injectIntl(UserInfosComponent);
