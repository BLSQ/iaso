import React, { Component } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import ReactModal from 'react-modal';
import TabsComponent from '../../../components/TabsComponent';


const MESSAGES = defineMessages({
    none: {
        defaultMessage: 'Aucun',
        id: 'vector.labels.none',
    },
    infos: {
        defaultMessage: 'Infos',
        id: 'vector.labels.infos',
    },
    traps: {
        defaultMessage: 'Pièges',
        id: 'vector.labels.traps',
    },
});
class EditNewSiteComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showModale: props.showModale,
            site: props.site,
            isChanged: false,
            currentTab: 'infos',
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
        const { site, currentTab } = this.state;
        const {
            saveSite,
            intl: {
                formatMessage,
            },
        } = this.props;
        return (
            <ReactModal
                isOpen={this.state.showModale}
                shouldCloseOnOverlayClick
                onRequestClose={() => this.props.toggleModal()}
            >
                <section className="edit-modal large extra">
                    <TabsComponent
                        isRedirecting={false}
                        selectTab={key => (this.setState({ currentTab: key }))}
                        tabs={[
                            { label: formatMessage(MESSAGES.infos), key: 'infos' },
                            { label: formatMessage(MESSAGES.traps), key: 'Pièges' },
                        ]}
                        defaultSelect={currentTab}
                        currentTab={currentTab}
                    />
                    {
                        currentTab === 'infos' &&
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
                                    </tbody>
                                </table>
                            </div>
                        </section>

                    }

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
EditNewSiteComponent.defaultProps = {
    site: undefined,
};
EditNewSiteComponent.propTypes = {
    showModale: PropTypes.bool.isRequired,
    toggleModal: PropTypes.func.isRequired,
    site: PropTypes.object,
    intl: PropTypes.object.isRequired,
    saveSite: PropTypes.func.isRequired,
};

export default injectIntl(EditNewSiteComponent);
