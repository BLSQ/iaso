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
class CoordinationModale extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            coordination: props.coordination,
            locations: props.locations,
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
                coordination: nextProps.coordination,
                locations: nextProps.locations,
                isChanged: false,
            });
        }
    }

    updateCoordinationField(key, value) {
        const newTeam = Object.assign({}, this.state.coordination, { [key]: value });
        this.setState({
            coordination: newTeam,
            isChanged: true,
        });
    }

    changeOption(key) {
        const newTeam =
            Object.assign({}, this.state.coordination, { [key]: !this.state.coordination[key] });
        this.setState({
            coordination: newTeam,
            isChanged: true,
        });
    }

    changeZs(zsIds) {
        const newZsArray = [];
        if (zsIds !== '') {
            const zsArrayIds = zsIds.split(',');
            zsArrayIds.forEach((newZs) => {
                newZsArray.push(this.state.locations.filter(location =>
                    location.id === parseInt(newZs, 10))[0]);
            });
        }
        this.updateCoordinationField('zs', newZsArray);
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
                            htmlFor={`name-${this.state.coordination.id}`}
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
                            id={`name-${this.state.coordination.id}`}
                            value={this.state.coordination.name}
                            onChange={event => this.updateCoordinationField('name', event.currentTarget.value)}
                        />
                    </div>
                    <div>
                        <label
                            htmlFor={`name-${this.state.coordination.id}`}
                            className="filter__container__select__label"
                        >
                            <span>ZS:</span>
                        </label>
                        <Select
                            multi
                            simpleValue
                            autosize={false}
                            name="zs_id"
                            value={this.state.coordination.zs.map(zsEl => zsEl.id)}
                            placeholder={formatMessage(MESSAGES['location-all'])}
                            options={this.state.locations.map(zs =>
                                ({ label: zs.name, value: zs.id }))}
                            onChange={zsIds => this.changeZs(zsIds)}
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
                                (this.state.coordination.name === '' ||
                                    (!this.state.isChanged && this.state.coordination.id !== 0))
                            }
                            className="button--save"
                            onClick={() => this.props.saveCoordination(this.state.coordination)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="mangement.label.saveCoordination" defaultMessage="Sauvegarder la coordination" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
CoordinationModale.defaultProps = {
    coordination: {
        id: 0,
        name: '',
        capacity: 0,
        UM: false,
        zs: [],
    },
};
CoordinationModale.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    coordination: PropTypes.object,
    saveCoordination: PropTypes.func.isRequired,
    locations: PropTypes.array.isRequired,
    intl: PropTypes.object.isRequired,
    isUpdating: PropTypes.bool.isRequired,
};

export default injectIntl(CoordinationModale);
