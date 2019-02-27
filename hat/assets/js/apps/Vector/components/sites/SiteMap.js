
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

class SitesInfo extends Component {
    render() {
        const { updateSiteField, site } = this.props;
        return (
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
                            onChange={event => updateSiteField('name', event.currentTarget.value)}
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
                                onChange={() => updateSiteField('is_reference', true)}
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
                                onChange={() => updateSiteField('is_reference', false)}
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
                                onChange={() => updateSiteField('ignore', true)}
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
                                onChange={() => updateSiteField('ignore', false)}
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
        );
    }
}

SitesInfo.propTypes = {
    site: PropTypes.object.isRequired,
    updateSiteField: PropTypes.func.isRequired,
};

const SitesInfoWithIntl = injectIntl(SitesInfo);


export default (SitesInfoWithIntl);
