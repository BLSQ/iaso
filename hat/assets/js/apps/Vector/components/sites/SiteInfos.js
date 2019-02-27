
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

class SiteInfos extends Component {
    render() {
        const { updateSiteField, site } = this.props;
        return (
            <section>
                <table>
                    <tbody>
                        <tr>
                            <th>
                                <FormattedMessage
                                    id="main.label.name"
                                    defaultMessage="Nom"
                                />
                            </th>
                            <td>
                                <input
                                    type="text"
                                    name="name"
                                    id={`name-${site.id}`}
                                    className={(!site.name || site.name === '') ? 'form-error' : ''}
                                    value={site.name}
                                    onChange={event => updateSiteField('name', event.currentTarget.value)}
                                />
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
            </section>
        );
    }
}

SiteInfos.propTypes = {
    site: PropTypes.object.isRequired,
    updateSiteField: PropTypes.func.isRequired,
};

const SiteInfosWithIntl = injectIntl(SiteInfos);


export default (SiteInfosWithIntl);
