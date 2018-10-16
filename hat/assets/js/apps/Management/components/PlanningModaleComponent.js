import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import ReactModal from 'react-modal';

class PlanningModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            planning: props.planning,
            isChanged: false,
            duplicateName: props.isDuplicate ? props.planning.name : null,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            duplicateName: nextProps.isDuplicate ? nextProps.planning.name : null,
        };
        if (!nextProps.isUpdating) {
            newState.showModale = nextProps.showModale;
            newState.planning = nextProps.planning;
            if (nextProps.isDuplicate) {
                newState.planning.year = '';
            }
            newState.isChanged = false;
        }
        this.setState(newState);
    }

    updatePlanningField(key, value) {
        const newTeam = Object.assign({}, this.state.planning, { [key]: value });
        this.setState({
            planning: newTeam,
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
                    {
                        this.props.isDuplicate &&
                        <div className="subtitle">
                            <FormattedMessage id="main.management.planning.duplicate" defaultMessage="Copie du planning" />:
                            {' '}{this.state.duplicateName}
                        </div>
                    }
                    <div>
                        <label
                            htmlFor={`name-${this.state.planning.id}`}
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
                            id={`name-${this.state.planning.id}`}
                            value={this.state.planning.name}
                            onChange={event => this.updatePlanningField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`year-${this.state.planning.id}`}
                            className="filter__container__select__label"
                        >
                            <FormattedMessage
                                id="main.label.year"
                                defaultMessage="Année"
                            />:
                        </label>
                        <input
                            disabled={this.state.planning.is_template && !this.props.isDuplicate}
                            type="number"
                            name="year"
                            id={`year-${this.state.planning.id}`}
                            value={this.state.planning.year}
                            onChange={event => this.updatePlanningField('year', event.currentTarget.value)}
                        />
                    </div>
                    {
                        this.props.canMakeTemplate && !this.props.isDuplicate &&
                        <div>
                            <label
                                htmlFor={`make-template-${this.state.planning.id}`}
                                className="filter__container__select__label"
                            >
                                <FormattedMessage
                                    id="management.planning.label.template"
                                    defaultMessage="Modèle"
                                />:
                            </label>
                            <input
                                type="checkbox"
                                name="make-template"
                                className=""
                                checked={this.state.planning.is_template ? 'checked' : ''}
                                onChange={() => this.updatePlanningField('is_template', !this.state.planning.is_template)}
                            />
                        </div>
                    }
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
                                (this.state.planning.name === '' ||
                                    this.state.planning.year === '' ||
                                    (!this.state.isChanged && this.state.planning.id !== 0))
                            }
                            className="button--save"
                            onClick={() => (this.props.isDuplicate ? this.props.duplicatePlanning(this.state.planning) : this.props.savePlanning(this.state.planning))}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.savePlanning" defaultMessage="Sauvegarder la planning" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
PlanningModale.defaultProps = {
    planning: {
        id: 0,
        name: '',
        year: '',
    },
    canMakeTemplate: false,
};
PlanningModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    planning: PropTypes.object,
    savePlanning: PropTypes.func.isRequired,
    duplicatePlanning: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool.isRequired,
    isDuplicate: PropTypes.bool.isRequired,
    canMakeTemplate: PropTypes.bool,
};

export default injectIntl(PlanningModale);
