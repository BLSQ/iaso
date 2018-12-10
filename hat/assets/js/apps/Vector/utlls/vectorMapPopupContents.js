import moment from 'moment';

export const renderSitesPopup = (site, formatMessage) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Site', id: 'vector.labels.site' })}:
                </h6>

                <table>
                    <tbody>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}
                            </td>
                            <td>
                                ${site.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}
                            </td>
                            <td>
                                ${site.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Zone', id: 'vector.labels.Zone' })}
                            </td>
                            <td>
                                ${site.zone === '' ? '/' : site.zone}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}
                            </td>
                            <td>
                                ${site.latitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}
                            </td>
                            <td>
                                ${site.longitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Habitat', id: 'vector.labels.habitat' })}
                            </td>
                            <td>
                                ${site.habitat === '' ? '/' : site.habitat}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Premier relevé', id: 'vector.labels.first_survey' })}
                            </td>
                            <td>
                                ${site.first_survey}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Date du premier relevé', id: 'vector.labels.first_survey_date' })}
                            </td>
                            <td>
                                ${moment(site.first_survey_date).format('hh:mm YYYY-MM-DD')}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Compte', id: 'vector.labels.count' })}
                            </td>
                            <td>
                                ${site.count}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Total', id: 'vector.labels.total' })}
                            </td>
                            <td>
                                ${site.total}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;

export const renderTargetsPopup = (target, formatMessage) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Ecran', id: 'vector.labels.target' })}:
                </h6>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}
                            </td>
                            <td>
                                ${target.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Altitude', id: 'vector.labels.altitude' })}
                            </td>
                            <td>
                                ${target.altitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}
                            </td>
                            <td>
                                ${target.latitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}
                            </td>
                            <td>
                                ${target.longitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Date', id: 'vector.labels.date_time' })}
                            </td>
                            <td>
                                ${moment(target.date_time).format('hh:mm YYYY-MM-DD')}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Déploiement', id: 'vector.labels.deployment' })}
                            </td>
                            <td>
                                ${target.deployment ? target.deployment : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Rivière', id: 'vector.labels.river' })}
                            </td>
                            <td>
                                ${target.river ? target.river : '/'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;

export const renderVillagesPopup = (village, formatMessage, isEndemic) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Village', id: 'vector.labels.village' })}:
                </h6>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Nom', id: 'vector.labels.name' })}:
                            </td>
                            <td>
                                ${village.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'As', id: 'vector.labels.as' })}:
                            </td>
                            <td>
                                ${village.as}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Zs', id: 'vector.labels.zs' })}:
                            </td>
                            <td>
                                ${village.zs}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}:
                            </td>
                            <td>
                                ${village.latitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}:
                            </td>
                            <td>
                                ${village.longitude}
                            </td>
                        </tr>
                        ${isEndemic ? `<tr>
                                <td>
                                    ${formatMessage({ defaultMessage: 'Cas positifs', id: 'vector.labels.nr_positive_cases' })}:
                                </td>
                                <td>
                                    ${village.nr_positive_cases}
                                </td>
                            </tr>` : ''}
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Population', id: 'vector.labels.population' })}:
                            </td>
                            <td>
                                ${village.population}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Source GPS', id: 'vector.labels.gps_source' })}:
                            </td>
                            <td>
                                ${village.gps_source}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;
