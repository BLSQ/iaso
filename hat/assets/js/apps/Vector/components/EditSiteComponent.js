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
class EditSiteComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            site: props.site,
            isChanged: false,
        };
    }

    componentWillMount() {
        ReactModal.setAppElement('.container--main');
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            showModale: nextProps.showModale,
            site: nextProps.site,
            isChanged: false,
        });
    }

    updateSiteField(key, value) {
        const newSite = Object.assign({}, this.state.site, { [key]: value });
        this.setState({
            site: newSite,
            isChanged: true,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        const { site } = this.state;
        const {
            habitats,
            profiles,
            saveSite,
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <div className="widget__header">
                    <FormattedMessage id="vector.modale.site.title" defaultMessage="Site" />:
                    {' '}{site.name}
                </div>
                <section className="edit-modal large extra">
                    <section className="half-container">
                        <div>
                            <div>
                                <label
                                    htmlFor={`name-${site.id}`}
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
                                    id={`name-${site.id}`}
                                    className={(!site.name || site.name === '') ? 'form-error' : ''}
                                    value={site.name}
                                    onChange={event => this.updateSiteField('name', event.currentTarget.value)}
                                />
                            </div>
                            <div className="flex-container">
                                <label
                                    htmlFor={`description-${site.id}`}
                                    className="filter__container__select__label textarea-label"
                                >
                                    <FormattedMessage
                                        id="main.label.description"
                                        defaultMessage="Description"
                                    />:
                                </label>
                                <textarea
                                    name="description"
                                    id={`description-${site.id}`}
                                    value={site.description}
                                    onChange={event => this.updateSiteField('description', event.currentTarget.value)}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor={`habitat-${site.id}`}
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
                                    value={site.habitat}
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
                                        id="verctor.label.reference"
                                        defaultMessage="Site de référence"
                                    />:
                                </label>
                                <section className="check-box-container">
                                    <input
                                        id={`reference-${site.id}`}
                                        type="radio"
                                        name="reference"
                                        checked={site.is_reference ? 'checked' : ''}
                                        value={site.is_reference}
                                        onChange={() => this.updateSiteField('is_reference', true)}
                                    />
                                    <label
                                        htmlFor={`reference-${site.id}`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.yes"
                                            defaultMessage="Oui"
                                        />
                                    </label>
                                    <input
                                        id={`reference-${site.id}-false`}
                                        type="radio"
                                        name="reference"
                                        checked={!site.is_reference ? 'checked' : ''}
                                        value={site.is_reference}
                                        onChange={() => this.updateSiteField('is_reference', false)}
                                    />
                                    <label
                                        htmlFor={`reference-${site.id}-false`}
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
                                        id={`ignore-${site.id}`}
                                        type="radio"
                                        name="ignore"
                                        checked={site.ignore ? 'checked' : ''}
                                        value={site.ignore}
                                        onChange={() => this.updateSiteField('ignore', true)}
                                    />
                                    <label
                                        htmlFor={`ignore-${site.id}`}
                                        className="checkbox-label"
                                    >
                                        <FormattedMessage
                                            id="verctor.label.yes"
                                            defaultMessage="Oui"
                                        />
                                    </label>
                                    <input
                                        id={`ignore-${site.id}-false`}
                                        type="radio"
                                        name="ignore"
                                        checked={!site.ignore ? 'checked' : ''}
                                        value={site.ignore}
                                        onChange={() => this.updateSiteField('ignore', false)}
                                    />
                                    <label
                                        htmlFor={`ignore-${site.id}-false`}
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
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.creation"
                                                defaultMessage="Création"
                                            />
                                        </th>
                                        <td>
                                            {moment(site.created_at).format('DD/MM/YYYY HH:mm')}
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
                                            {site.username}
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
                                            {site.latitude}
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
                                            {site.longitude}
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
                                            {site.altitude}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.accuracy"
                                                defaultMessage="Précision"
                                            />
                                        </th>
                                        <td>{site.accuracy ? site.accuracy : '--'}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.source"
                                                defaultMessage="Source"
                                            />
                                        </th>
                                        <td>{site.source}</td>
                                    </tr>
                                    <tr>
                                        <th>
                                            <FormattedMessage
                                                id="vector.label.catchs"
                                                defaultMessage="Déploiements"
                                            />
                                        </th>
                                        <td>{site.catchs_count}</td>
                                    </tr>
                                    {
                                        site.catchs_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.male"
                                                    defaultMessage="Males"
                                                />
                                            </th>
                                            <td>{site.catchs_count_male}</td>
                                        </tr>
                                    }
                                    {
                                        site.catchs_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.female"
                                                    defaultMessage="Femelles"
                                                />
                                            </th>
                                            <td>{site.catchs_count_female}</td>
                                        </tr>
                                    }
                                    {
                                        site.catchs_count > 0 &&
                                        <tr>
                                            <th>
                                                <FormattedMessage
                                                    id="vector.label.unknown"
                                                    defaultMessage="Inconnus"
                                                />
                                            </th>
                                            <td>{site.catchs_count_unknown}</td>
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
                                (site.name === '' ||
                                    !this.state.isChanged)
                            }
                            className="button--save"
                            onClick={() => saveSite(site)}
                        >
                            <i className="fa fa-save" />
                            <FormattedMessage id="vector.label.savesite" defaultMessage="Sauvegarder le site" />
                        </button>
                    </div>
                </section>
            </ReactModal>
        );
    }
}
EditSiteComponent.defaultProps = {
    site: undefined,
};
EditSiteComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    site: PropTypes.object,
    intl: PropTypes.object.isRequired,
    habitats: PropTypes.array.isRequired,
    profiles: PropTypes.array.isRequired,
    saveSite: PropTypes.func.isRequired,
};

export default injectIntl(EditSiteComponent);
