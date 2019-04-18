import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import Select from 'react-select';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
});
class EditTrapComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            trap: props.trap,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            trap: nextProps.trap,
            isChanged: false,
        });
    }

    updateSiteField(key, value) {
        const newTrap = Object.assign({}, this.state.trap, { [key]: value });
        this.setState({
            trap: newTrap,
            isChanged: true,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        const { trap } = this.state;
        const {
            habitats,
            saveTrap,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.trap.title" defaultMessage="Piège" />:
                    {' '}{trap.name}
                </div>
                <section className="edit-modal large extra">
                    <section className="half-container">
                        <div>
                            <div>
                                <label
                                    htmlFor={`name-${trap.id}`}
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
                                    id={`name-${trap.id}`}
                                    className={(!trap.name || trap.name === '') ? 'form-error' : ''}
                                    value={trap.name}
                                    onChange={event => this.updateSiteField('name', event.currentTarget.value)}
                                />
                            </div>
                            <div className="flex-container">
                                <label
                                    htmlFor={`description-${trap.id}`}
                                    className="filter__container__select__label textarea-label"
                                >
                                    <FormattedMessage
                                        id="main.label.description"
                                        defaultMessage="Description"
                                    />:
                                </label>
                                <textarea
                                    name="description"
                                    id={`description-${trap.id}`}
                                    value={trap.description || ''}
                                    onChange={event => this.updateSiteField('description', event.currentTarget.value)}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={`habitat-${trap.id}`}
                                    className="filter__container__select__label select-label"
                                >
                                    <FormattedMessage
                                        id="vector.label.habitat"
                                        defaultMessage="Habitat"
                                    />:
                                </label>
                                <Select
                                    multi={false}
                                    simpleValue
                                    autosize={false}
                                    name="habitat"
                                    value={trap.habitat}
                                    placeholder={formatMessage(MESSAGES.none)}
                                    options={habitats.map(h =>
                                        ({ label: h[1], value: h[0] }))}
                                    onChange={habitat => this.updateSiteField('habitat', habitat)}
                                />
                            </div>
                            <div className="flex-container">
                                <label
                                    className="filter__container__select__label"
                                >
                                    <FormattedMessage
                                        id="verctor.label.selected"
                                        defaultMessage="Piège sélectionné"
                                    />:
                                </label>
                                <section className="check-box-container">
                                    <input
                                        id={`selected-${trap.id}`}
                                        type="radio"
                                        name="selected"
                                        checked={trap.is_selected ? 'checked' : ''}
                                        value={trap.is_selected}
                                        onChange={() => this.updateSiteField('is_selected', true)}
                                    />
                                    <label
                                        htmlFor={`selected-${trap.id}`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.yes"
                                            defaultMessage="Oui"
                                        />
                                    </label>
                                    <input
                                        id={`selected-${trap.id}-false`}
                                        type="radio"
                                        name="selected"
                                        checked={!trap.is_selected ? 'checked' : ''}
                                        value={trap.is_selected}
                                        onChange={() => this.updateSiteField('is_selected', false)}
                                    />
                                    <label
                                        htmlFor={`selected-${trap.id}-false`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.no"
                                            defaultMessage="Non"
                                        />
                                    </label>
                                </section>
                            </div>
                            <div className="flex-container">
                                <label
                                    className="filter__container__select__label"
                                >
                                    <FormattedMessage
                                        id="verctor.label.ignore"
                                        defaultMessage="Ignorer"
                                    />:
                                </label>
                                <section className="check-box-container">
                                    <input
                                        id={`ignore-${trap.id}`}
                                        type="radio"
                                        name="ignore"
                                        checked={trap.ignore ? 'checked' : ''}
                                        value={trap.ignore}
                                        onChange={() => this.updateSiteField('ignore', true)}
                                    />
                                    <label
                                        htmlFor={`ignore-${trap.id}`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.yes"
                                            defaultMessage="Oui"
                                        />
                                    </label>
                                    <input
                                        id={`ignore-${trap.id}-false`}
                                        type="radio"
                                        name="ignore"
                                        checked={!trap.ignore ? 'checked' : ''}
                                        value={trap.ignore}
                                        onChange={() => this.updateSiteField('ignore', false)}
                                    />
                                    <label
                                        htmlFor={`ignore-${trap.id}-false`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.no"
                                            defaultMessage="Non"
                                        />
                                    </label>
                                </section>
                            </div>
                        </div>
                        <div>
                            <table>
                                <tbody>
                                    <tr>
                                        <th>UUID</th>
                                        <td className="small">
                                            {trap.uuid}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.creation"
                                                defaultMessage="Création"
                                            />
                                        </th>
                                        <td>
                                            {moment(trap.created_at).format('DD/MM/YYYY HH:mm')}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.user"
                                                defaultMessage="Utilisateur"
                                            />
                                        </th>
                                        <td>
                                            {trap.username}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.latitude"
                                                defaultMessage="Latitude"
                                            />
                                        </th>
                                        <td>
                                            {trap.latitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.longitude"
                                                defaultMessage="Longitude"
                                            />
                                        </th>
                                        <td>
                                            {trap.longitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.altitude"
                                                defaultMessage="Altitude"
                                            />
                                        </th>
                                        <td>
                                            {trap.altitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.accuracy"
                                                defaultMessage="Précision"
                                            />
                                        </th>
                                        <td>{trap.accuracy ? trap.accuracy : '--'}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.source"
                                                defaultMessage="Source"
                                            />
                                        </th>
                                        <td>{trap.source}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.catches"
                                                defaultMessage="Déploiements"
                                            />
                                        </th>
                                        <td>{trap.catches_count}</td>
                                    </tr>
                                    {
                                        trap.catches_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.male"
                                                    defaultMessage="Males"
                                                />
                                            </th>
                                            <td>{trap.catches_count_male}</td>
                                        </tr>
                                    }
                                    {
                                        trap.catches_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.female"
                                                    defaultMessage="Femelles"
                                                />
                                            </th>
                                            <td>{trap.catches_count_female}</td>
                                        </tr>
                                    }
                                    {
                                        trap.catches_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.unknown"
                                                    defaultMessage="Inconnus"
                                                />
                                            </th>
                                            <td>{trap.catches_count_unknown}</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="align-right">
                        <button
                            className="button"
                            onClick={() => this.props.toggleModal()}
                        >
                            <i className="fa fa-arrow-left" />
                            <FormattedMessage id="main.label.close" defaultMessage="Fermer" />
                        </button>
                        <button
                            disabled={
                                (trap.name === '' ||
                                    !this.state.isChanged)
                            }
                            className="button--save"
                            onClick={() => saveTrap(trap)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="vector.label.savetrap" defaultMessage="Sauvegarder le piège" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditTrapComponent.defaultProps = {
    trap: undefined,
};
EditTrapComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    trap: PropTypes.object,
    intl: PropTypes.object.isRequired,
    habitats: PropTypes.array.isRequired,
    saveTrap: PropTypes.func.isRequired,
};

export default injectIntl(EditTrapComponent);
