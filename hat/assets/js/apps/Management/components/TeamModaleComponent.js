import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';


class TeamModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            team: props.team,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.isUpdating) {
            this.setState({
                showModale: nextProps.showModale,
                team: nextProps.team,
                isChanged: false,
            });
        }
    }

    updateTeamField(key, value) {
        const newTeam = Object.assign({}, this.state.team, { [key]: value });
        this.setState({
            team: newTeam,
            isChanged: true,
        });
    }

    changeOption(key) {
        const newTeam = Object.assign({}, this.state.team, { [key]: !this.state.team[key] });
        this.setState({
            team: newTeam,
            isChanged: true,
        });
    }

    render() {
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal">
                    <div>
                        <label
                            htmlFor={`name-${this.state.team.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.coordination"
                                defaultMessage="Coordination"
                            />:
                        </label>
                        <Select
                            id={`coordination-${this.state.team.id}`}
                            className={!this.state.team.coordination_id ? 'form-error' : ''}
                            simpleValue
                            name="team_coordination_id"
                            value={this.state.team.coordination_id}
                            options={this.props.coordinations.map(coordination =>
                                ({ label: coordination.name, value: coordination.id }))}
                            onChange={coordinationId => this.updateTeamField('coordination_id', parseInt(coordinationId, 10))}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.team.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.name"
                                defaultMessage="Nom"
                            />:
                        </label>
                        <input
                            type="text"
                            name="name"
                            className={(!this.state.team.name || this.state.team.name === '') ? 'form-error' : ''}
                            id={`name-${this.state.team.id}`}
                            value={this.state.team.name}
                            onChange={event => this.updateTeamField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`capacity-${this.state.team.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.capacity"
                                defaultMessage="Capacité"
                            />:
                        </label>
                        <input
                            type={this.state.team.capacity ? 'number' : 'text'}
                            min="0"
                            name="capacity"
                            className={(!this.state.team.capacity || this.state.team.capacity === '') ? 'form-error' : ''}
                            id={`capacity-${this.state.team.id}`}
                            value={this.state.team.capacity ? this.state.team.capacity : ''}
                            onChange={event => this.updateTeamField('capacity', parseInt(event.currentTarget.value, 10))}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`type-${this.state.team.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.um"
                                defaultMessage="UM"
                            />:
                        </label>
                        <section
                            onClick={() => this.changeOption('UM')}
                            role="button"
                            tabIndex={0}
                        >
                            <input
                                id={`type-${this.state.team.id}`}
                                type="radio"
                                name="type"
                                checked={this.state.team.UM ? 'checked' : ''}
                                value={this.state.team.UM}
                                onChange={() => this.changeOption('UM')}
                            />
                            <FormattedMessage id="main.submit.yes" defaultMessage="Oui" />
                            <input
                                id={`type-${this.state.team.id}-false`}
                                type="radio"
                                name="type"
                                checked={!this.state.team.UM ? 'checked' : ''}
                                value={this.state.team.UM}
                                onChange={() => this.changeOption('UM')}
                            />
                            <FormattedMessage id="main.submit.no" defaultMessage="Non" />
                        </section>
                    </div>
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
                                ((!this.state.team.coordination_id ||
                                    this.state.team.name === '' ||
                                    !this.state.team.capacity) ||
                                    (!this.state.isChanged && this.state.team.id !== 0))
                            }
                            className="button--save"
                            onClick={() => this.props.saveTeam(this.state.team)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveTeam" defaultMessage="Sauvegarder l'équipe" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
TeamModale.defaultProps = {
    team: {
        id: 0,
        name: '',
        capacity: 0,
        UM: false,
    },
};
TeamModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    team: PropTypes.object,
    coordinations: PropTypes.array.isRequired,
    saveTeam: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool.isRequired,
};

export default injectIntl(TeamModale);
