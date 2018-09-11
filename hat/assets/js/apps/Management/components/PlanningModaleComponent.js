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
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.isUpdating) {
            this.setState({
                showModale: nextProps.showModale,
                planning: nextProps.planning,
                isChanged: false,
            });
        }
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
                            type="number"
                            name="year"
                            id={`year-${this.state.planning.id}`}
                            value={this.state.planning.year}
                            onChange={event => this.updatePlanningField('year', event.currentTarget.value)}
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
                                (this.state.planning.name === '' ||
                                    this.state.planning.year === '' ||
                                    (!this.state.isChanged && this.state.planning.id !== 0))
                            }
                            className="button--save"
                            onClick={() => this.props.savePlanning(this.state.planning)}
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
};
PlanningModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    planning: PropTypes.object,
    savePlanning: PropTypes.func.isRequired,
    isUpdating: PropTypes.bool.isRequired,
};

export default injectIntl(PlanningModale);
