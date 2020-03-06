
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { deepEqual } from '../../../utils';
import { MESSAGES } from '../../../utils/constants/filters';
import CheckBox from '../../../components/CheckBoxComponent';


const LOCAL_MESSAGES = defineMessages({
    none: {
        defaultMessage: 'None',
        id: 'main.label.noneFem',
    },
    noneMasc: {
        defaultMessage: 'None',
        id: 'main.label.none',
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
            coordinations,
            teams,
            password,
            testerTypes,
            screeningTypes,
            userLevels,
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
                            defaultMessage="User name"
                        />
                        :
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
                            defaultMessage="First name"
                        />
                        :
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
                            defaultMessage="Name"
                        />
                        :
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
                            defaultMessage="Phone"
                        />
                        :
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
                            defaultMessage="E-mail"
                        />
                        :
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
                            defaultMessage="Tester type"
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="tester_type"
                        value={this.state.user.tester_type}
                        placeholder={formatMessage(LOCAL_MESSAGES.noneMasc)}
                        options={testerTypes.map(t => ({ label: formatMessage(MESSAGES[t[0]]), value: t[0] }))}
                        onChange={testerType => this.props.updateUserField('tester_type', testerType)}
                    />
                </div>
                <div>
                    <label
                        htmlFor="user_level"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.user_level"
                            defaultMessage="QC level"
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="user_level"
                        clearable={false}
                        value={this.state.user.level || 10}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={userLevels.map(l => ({ label: l[1], value: l[0] }))}
                        onChange={level => this.props.updateUserField('level', level)}
                    />
                </div>
                <div className="relative">
                    <label
                        htmlFor="password"
                        className="filter__container__select__label"
                    >
                        {
                            this.state.user.id === 0
                            && (
                                <FormattedMessage
                                    id="main.label.password"
                                    defaultMessage="Password"
                                />
                            )
                        }
                        {
                            this.state.user.id !== 0
                            && (
                                <FormattedMessage
                                    id="main.label.newPassword"
                                    defaultMessage="New password"
                                />
                            )
                        }
                        :
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
                            !this.state.displayPassword
                            && <i className="fa fa-eye" aria-hidden="true" />
                        }
                        {
                            this.state.displayPassword
                            && <i className="fa fa-eye-slash" aria-hidden="true" />
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
                            defaultMessage="Team"
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="team_id"
                        value={this.state.user.team}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={teams.map(team => ({ label: team.name, value: team.id }))}
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
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="institution_id"
                        value={this.state.user.institution ? this.state.user.institution.id : null}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={institutions.map(institution => ({ label: institution.name, value: institution.id }))}
                        onChange={institutionId => this.props.updateUserField('institution', { id: institutionId })}
                    />
                </div>
                <div>
                    <label
                        htmlFor="screeningType"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.screening_type"
                            defaultMessage="Screening type"
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="screening_type"
                        value={this.state.user.screening_type}
                        placeholder={formatMessage(LOCAL_MESSAGES.noneMasc)}
                        options={screeningTypes.map(t => ({ label: formatMessage(MESSAGES[t[0]]), value: t[0] }))}
                        onChange={screeningType => this.props.updateUserField('screening_type', screeningType)}
                    />
                </div>
                <div>
                    <label
                        htmlFor="coordination"
                        className="filter__container__select__label"
                    >
                        <FormattedMessage
                            id="main.label.coordination"
                            defaultMessage="Coordination"
                        />
                        :
                    </label>
                    <Select
                        simpleValue
                        name="coordination_id"
                        value={this.state.user.coordination ? this.state.user.coordination.id : null}
                        placeholder={formatMessage(LOCAL_MESSAGES.none)}
                        options={coordinations.map(coordination => ({ label: coordination.name, value: coordination.id }))}
                        onChange={coordinationId => this.props.updateUserField('coordination', { id: coordinationId })}
                    />
                </div>
                <div>
                    <CheckBox
                        isChecked={Boolean(this.state.user.passwordReset)}
                        keyValue="passwordReset"
                        showSemicolon
                        labelClassName="filter__container__select__label"
                        labelObj={{
                            id: 'management.user.resetpassword',
                            defaultMessage: 'Reset password',
                        }}
                        toggleCheckbox={checked => this.props.updateUserField('passwordReset', checked)}
                    />
                </div>
                <div>
                    <CheckBox
                        isChecked={Boolean(this.state.user.is_active)}
                        keyValue="is_active"
                        showSemicolon
                        labelClassName="filter__container__select__label"
                        labelObj={{
                            id: 'management.user.isActive',
                            defaultMessage: 'User active',
                        }}
                        toggleCheckbox={checked => this.props.updateUserField('is_active', checked)}
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
    coordinations: PropTypes.array.isRequired,
    teams: PropTypes.array.isRequired,
    updateUserField: PropTypes.func.isRequired,
    updatePassword: PropTypes.func.isRequired,
    password: PropTypes.string.isRequired,
    testerTypes: PropTypes.array.isRequired,
    userLevels: PropTypes.array.isRequired,
};

export default injectIntl(UserInfosComponent);
