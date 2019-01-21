import moment from 'moment';
import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    map: {
        defaultMessage: 'Carte',
        id: 'details.label.map',
    },
    sites: {
        defaultMessage: 'Sites',
        id: 'details.label.sites',
    },
    targets: {
        defaultMessage: 'Ecrans',
        id: 'details.label.targets',
    },
    unknown: {
        defaultMessage: 'Inconnu',
        id: 'vectors.label.unknown',
    },
    bush: {
        defaultMessage: 'Buisson',
        id: 'vectors.label.bush',
    },
    fish_pond: {
        defaultMessage: 'Etang à poissons',
        id: 'vectors.label.fish_pond',
    },
    farm: {
        defaultMessage: 'Ferme',
        id: 'vectors.label.farm',
    },
    forest: {
        defaultMessage: 'Forêt',
        id: 'vectors.label.forest',
    },
    lake: {
        defaultMessage: 'Lac',
        id: 'vectors.label.lake',
    },
    river: {
        defaultMessage: 'Rivière',
        id: 'vectors.label.river',
    },
    stream: {
        defaultMessage: 'Ruisseau',
        id: 'vectors.label.stream',
    },
    road: {
        defaultMessage: 'Route',
        id: 'vectors.label.road',
    },
    cluster_title: {
        defaultMessage: 'Regroupement des sites',
        id: 'vectors.labels.cluster_title',
    },
});

const editSiteButton = siteId => `<button
    class="button--tiny"
    id="edit-button"
    data-id="${siteId}"
    data-type="site"
    >
    <i class="fa fa-pencil-square-o"> </i>
    </button>`;

const editCatchButton = (siteId, withAction) => {
    if (withAction) {
        return `<button
        class="button--tiny"
        id="catches-button"
        data-id="${siteId}"
        data-type="catches"
        >
        <i class="fa fa-eye"> </i>
        </button>`;
    }
    return '';
};

export const renderSitesPopup = (site, formatMessage, withActions = true) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Site', id: 'vector.labels.site' })}:
                    ${withActions ? editSiteButton(site.id) : ''}
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
                                ${formatMessage({ defaultMessage: 'Pièges', id: 'vector.labels.catches' })}
                            </td>
                            <td>
                                ${site.catches_count}
                                ${site.catches_count > 0 ? editCatchButton(site.id, withActions) : ''}

                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Mâles', id: 'vector.labels.male' })}
                            </td>
                            <td>
                                ${site.catches_count_male || '0'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Femelles', id: 'vector.labels.female' })}
                            </td>
                            <td>
                                ${site.catches_count_female || '0'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Inconnus', id: 'vector.labels.unknown' })}
                            </td>
                            <td>
                                ${site.catches_count_unknown || '0'}
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
                                ${formatMessage({ defaultMessage: 'Altitude', id: 'vector.labels.altitude' })}
                            </td>
                            <td class="${!site.altitude ? 'align-center' : ''}">
                                ${site.altitude ? site.altitude : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Habitat', id: 'vector.labels.habitat' })}
                            </td>
                            <td>
                                ${!site.habitat || site.habitat === '' ? formatMessage(MESSAGES.unknown) : formatMessage(MESSAGES[site.habitat])}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Date de création', id: 'vector.labels.created_at' })}
                            </td>
                            <td>
                                ${moment(site.created_at.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Site de référence', id: 'vector.labels.is_reference' })}
                            </td>
                            <td>
                            ${site.is_reference ?
        formatMessage({ defaultMessage: 'oui', id: 'vector.labels.yes' }) : formatMessage({ defaultMessage: 'non', id: 'vector.labels.yes' })}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;

export const renderTargetsPopup = (target, formatMessage) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Ecran', id: 'vector.labels.target' })}:
                    <button class="button--tiny"
                        id="edit-button"
                        data-id="${target.id}"
                        data-type="target"
                    >
                    <i class="fa fa-pencil-square-o"> </i>
                        </button>
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
                                ${formatMessage({ defaultMessage: 'Utilisateur', id: 'vector.labels.user' })}
                            </td>
                            <td>
                                ${target.username}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Date', id: 'vector.labels.date_time' })}
                            </td>
                            <td>
                                ${moment(target.date_time.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Déploiement', id: 'vector.labels.deployment' })}
                            </td>
                            <td class="${!target.deployment ? 'align-center' : ''}">
                                ${target.deployment ? target.deployment : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Rivière', id: 'vector.labels.river' })}
                            </td>
                            <td class="${!target.river ? 'align-center' : ''}">
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
                                ${formatMessage({ defaultMessage: 'Description', id: 'vector.labels.description' })}:
                            </td>
                            <td>
                                ${village.description}
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
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Province', id: 'vector.labels.province' })}
                            </td>
                            <td class="${!village.province ? 'align-center' : ''}">
                                ${village.province ? village.province : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Zone', id: 'vector.labels.zone' })}
                            </td>
                            <td class="${!village.zs ? 'align-center' : ''}">
                                ${village.zs ? village.zs : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Aire', id: 'vector.labels.area' })}
                            </td>
                            <td class="${!village.as ? 'align-center' : ''}">
                                ${village.as ? village.as : '/'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;


export const renderCatchesPopup = (catchItem, formatMessage) => `<section class="custom-popup-container">
            <h6>
                ${formatMessage({ defaultMessage: 'Piège', id: 'vector.labels.catch' })}:
            </h6>
            <table>
                <tbody>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Dernière collecte', id: 'vector.labels.collect_date' })}
                        </td>
                        <td>
                            ${moment(catchItem.collect_date.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Date de création', id: 'vector.labels.created_at' })}
                        </td>
                        <td>
                            ${moment(catchItem.setup_date.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Mâles', id: 'vector.labels.male' })}
                        </td>
                        <td>
                            ${catchItem.male_count || '0'}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Femelles', id: 'vector.labels.female' })}
                        </td>
                        <td>
                            ${catchItem.female_count || '0'}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Inconnus', id: 'vector.labels.unknown' })}
                        </td>
                        <td>
                            ${catchItem.unknown_count || '0'}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Source', id: 'vector.labels.source' })}
                        </td>
                        <td class="${!catchItem.source ? 'align-center' : ''}">
                            ${catchItem.source || '/'}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Latitude', id: 'vector.labels.latitude' })}
                        </td>
                        <td>
                            ${catchItem.latitude}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Longitude', id: 'vector.labels.longitude' })}
                        </td>
                        <td>
                            ${catchItem.longitude}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Altitude', id: 'vector.labels.altitude' })}
                        </td>
                        <td class="${!catchItem.catchItem ? 'align-center' : ''}">
                            ${catchItem.altitude ? catchItem.altitude : '/'}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Utilisateur', id: 'vector.labels.user' })}
                        </td>
                        <td>
                            ${catchItem.username}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            ${formatMessage({ defaultMessage: 'Remarques', id: 'vector.labels.remarks' })}
                        </td>
                        <td>
                            ${catchItem.remarks}
                        </td>
                    </tr>
                </tbody>
            </table>
        </section>`;

export const itemsToShow = params => [
    {
        id: 'sites',
        defaultMessage: 'Sites',
        isActive: params.sites === 'true',
        iconClass: 'map__option__icon--sites',
    },
    {
        id: 'targets',
        defaultMessage: 'Ecrans',
        isActive: params.targets === 'true',
        iconClass: 'map__option__icon--targets',
    },
    {
        id: 'nonEndemicVillages',
        defaultMessage: 'Villages non endémiques',
        isActive: params.nonEndemicVillages === 'true',
        iconClass: 'map__option__icon--villages',
    },
    {
        id: 'endemicVillages',
        defaultMessage: 'Villages endémiques',
        isActive: params.endemicVillages === 'true',
        iconClass: 'map__option__icon--villages-with-case',
    },
];
