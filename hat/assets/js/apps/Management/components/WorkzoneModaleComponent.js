import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';


const MESSAGES = defineMessages({
    'location-all': {
        defaultMessage: 'All',
        id: 'microplanning.labels.all',
    },
});
class WorkzoneModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            workzone: props.workzone,
            teams: props.teams,
            coordinations: props.coordinations,
            plannings: props.plannings,
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
                workzone: nextProps.workzone,
                teams: nextProps.teams,
                coordinations: nextProps.coordinations,
                plannings: nextProps.plannings,
                isChanged: false,
            });
        }
    }

    updateWorkzoneField(key, value) {
        const newTeam = Object.assign({}, this.state.workzone, { [key]: value });
        this.setState({
            workzone: newTeam,
            isChanged: true,
        });
    }

    changeSelect(ids, key) {
        const newArray = [];
        if (ids !== '') {
            const arrayIds = ids.split(',');
            arrayIds.forEach((newItem) => {
                newArray.push(this.state[key].filter(el =>
                    el.id === parseInt(newItem, 10))[0]);
            });
        }
        this.updateWorkzoneField(key, newArray);
    }


    render() {
        const { formatMessage } = this.props.intl;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal">
                    <div>
                        <label
                            htmlFor={`name-${this.state.workzone.id}`}
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
                            id={`name-${this.state.workzone.id}`}
                            value={this.state.workzone.name}
                            className={!this.state.workzone.name || this.state.workzone.name === '' ? 'form-error' : ''}
                            onChange={event => this.updateWorkzoneField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.workzone.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage id="main.label.planning" defaultMessage="Planning" />
                        </label>
                        <Select
                            multi={false}
                            simpleValue
                            clearable={false}
                            autosize={false}
                            name="planning_id"
                            value={this.state.workzone.planning_id}
                            className={!this.state.workzone.planning_id ? 'form-error' : ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.state.plannings.map(planning =>
                                ({ label: planning.name, value: planning.id }))}
                            onChange={planningId => this.updateWorkzoneField('planning_id', planningId)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.workzone.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage id="main.label.coordination" defaultMessage="Coordination" />
                        </label>
                        <Select
                            multi={false}
                            simpleValue
                            clearable={false}
                            autosize={false}
                            name="coordination_id"
                            value={this.state.workzone.coordination_id}
                            className={!this.state.workzone.coordination_id ? 'form-error' : ''}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.state.coordinations.map(coordination =>
                                ({ label: coordination.name, value: coordination.id }))}
                            onChange={coordinationId => this.updateWorkzoneField('coordination_id', coordinationId)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.workzone.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage id="main.label.teams" defaultMessage="Equipe" />
                        </label>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            name="team_id"
                            value={this.state.workzone.teams.map(t => t.id)}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            className={this.state.workzone.teams.length === 0 ? 'form-error' : ''}
                            options={this.state.teams.map(team =>
                                ({ label: team.name, value: team.id }))}
                            onChange={teamIds => this.changeSelect(teamIds, 'teams')}
                        />
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
                                (this.state.workzone.name === '' ||
                                    this.state.workzone.planning_id === undefined ||
                                    this.state.workzone.coordination_id === undefined ||
                                    this.state.workzone.teams.length === 0 ||
                                    (!this.state.isChanged && this.state.workzone.id !== 0))
                            }
                            className="button--save"
                            onClick={() => this.props.saveWorkzone(this.state.workzone)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveWorkzone" defaultMessage="Sauvegarder la workzone" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
WorkzoneModale.defaultProps = {
    workzone: {
        id: 0,
        name: '',
        teams: [],
        coordinations: [],
        plannings: [],
    },
};
WorkzoneModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    workzone: PropTypes.object,
    saveWorkzone: PropTypes.func.isRequired,
    teams: PropTypes.array.isRequired,
    coordinations: PropTypes.array.isRequired,
    plannings: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
    isUpdating: PropTypes.bool.isRequired,
};

export default injectIntl(WorkzoneModale);
