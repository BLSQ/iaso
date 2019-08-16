import moment from 'moment';
import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    map: {
        defaultMessage: 'Map',
        id: 'main.label.map',
    },
    sites: {
        defaultMessage: 'Sites',
        id: 'main.label.sites',
    },
    traps: {
        defaultMessage: 'Traps',
        id: 'main.label.traps',
    },
    targets: {
        defaultMessage: 'Targets',
        id: 'main.label.targets',
    },
    catches: {
        defaultMessage: 'Catches',
        id: 'main.label.catches',
    },
    unknown: {
        defaultMessage: 'Unknown',
        id: 'main.label.unknown',
    },
    cluster_title: {
        defaultMessage: 'Clustering',
        id: 'vectors.labels.cluster_title',
    },
});


export const renderSitesPopup = (site, formatMessage) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Site', id: 'main.label.site' })}:
                </h6>

                <table>
                    <tbody>
                        <tr>
                            <td>UUID</td>
                            <td>
                                ${site.uuid}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Name', id: 'main.label.name' })}
                            </td>
                            <td>
                                ${site.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Latitude', id: 'main.label.latitude' })}
                            </td>
                            <td>
                                ${site.latitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Longitude', id: 'main.label.longitude' })}
                            </td>
                            <td>
                                ${site.longitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Altitude', id: 'main.label.altitude' })}
                            </td>
                            <td class="${!site.altitude ? 'align-center' : ''}">
                                ${site.altitude ? site.altitude : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Creation date', id: 'main.label.creationDate' })}
                            </td>
                            <td>
                                ${moment(site.created_at.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>`;

export const renderTrapsPopup = (trap, formatMessage, habitats) => {
    let habitatLabel = formatMessage(MESSAGES.unknown);
    if (trap.habitat) {
        const currentHabitat = habitats.find(h => h[0] === trap.habitat);
        habitatLabel = formatMessage({
            id: currentHabitat[0],
            defaultMessage: currentHabitat[1],
        });
    }
    return `<section class="custom-popup-container">
    <h6>
        ${formatMessage({ defaultMessage: 'Trap', id: 'main.label.trap' })}:
    </h6>

    <table>
        <tbody>
            <tr>
                <td>UUID</td>
                <td>
                    ${trap.uuid}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Name', id: 'main.label.name' })}
                </td>
                <td>
                    ${trap.name}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Catches', id: 'main.label.catches' })}
                </td>
                <td>
                    ${trap.catches_count !== undefined ? trap.catches_count : '0'}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Male', id: 'vector.catchs.male' })}
                </td>
                <td>
                    ${trap.catches_count_male || '0'}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Female', id: 'vector.catchs.female' })}
                </td>
                <td>
                    ${trap.catches_count_female || '0'}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Unknown', id: 'main.label.unknown' })}
                </td>
                <td>
                    ${trap.catches_count_unknown || '0'}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Latitude', id: 'main.label.latitude' })}
                </td>
                <td>
                    ${trap.latitude}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Longitude', id: 'main.label.longitude' })}
                </td>
                <td>
                    ${trap.longitude}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Altitude', id: 'main.label.altitude' })}
                </td>
                <td class="${!trap.altitude ? 'align-center' : ''}">
                    ${trap.altitude ? trap.altitude : '/'}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Habitat', id: 'main.label.habitat' })}
                </td>
                <td>
                    ${habitatLabel}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Created at', id: 'main.label.created_at' })}
                </td>
                <td>
                    ${moment(trap.created_at.replace('Z', '')).format('HH:mm DD/MM/YYYY')}
                </td>
            </tr>
            <tr>
                <td>
                    ${formatMessage({ defaultMessage: 'Trap selected', id: 'vector.labels.is_selected' })}
                </td>
                <td>
                    <input
                        name="isGoing"
                        type="checkbox"
                        ${trap.is_selected === true ? 'checked' : ''}
                        id="selected-trap-select"
                        />
                </td>
            </tr>
        </tbody>
    </table>
</section>`;
};


export const renderVillagesPopup = (village, formatMessage, isEndemic) => `<section class="custom-popup-container">
                <h6>
                    ${formatMessage({ defaultMessage: 'Village', id: 'main.label.village' })}:
                </h6>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Name', id: 'main.label.name' })}:
                            </td>
                            <td>
                                ${village.name}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Description', id: 'main.label.description' })}:
                            </td>
                            <td>
                                ${village.description}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Latitude', id: 'main.label.latitude' })}:
                            </td>
                            <td>
                                ${village.latitude}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Longitude', id: 'main.label.longitude' })}:
                            </td>
                            <td>
                                ${village.longitude}
                            </td>
                        </tr>
                        ${isEndemic ? `<tr>
                                <td>
                                    ${formatMessage({ defaultMessage: 'Positive cases', id: 'vector.labels.nr_positive_cases' })}:
                                </td>
                                <td>
                                    ${village.nr_positive_cases}
                                </td>
                            </tr>` : ''}
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Population', id: 'main.label.population' })}:
                            </td>
                            <td>
                                ${village.population}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'GPS source', id: 'main.label.gps_source' })}:
                            </td>
                            <td>
                                ${village.gps_source}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Province', id: 'main.label.province' })}
                            </td>
                            <td class="${!village.province ? 'align-center' : ''}">
                                ${village.province ? village.province : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Health zone', id: 'main.label.zone' })}
                            </td>
                            <td class="${!village.zs ? 'align-center' : ''}">
                                ${village.zs ? village.zs : '/'}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                ${formatMessage({ defaultMessage: 'Health area', id: 'main.label.area' })}
                            </td>
                            <td class="${!village.as ? 'align-center' : ''}">
                                ${village.as ? village.as : '/'}
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
        id: 'traps',
        defaultMessage: 'Traps',
        isActive: params.traps === 'true',
        iconClass: 'map__option__icon--traps',
    },
    {
        id: 'catches',
        defaultMessage: 'Catches',
        isActive: params.catches === 'true',
        iconClass: 'map__option__icon--catches',
    },
    {
        id: 'targets',
        defaultMessage: 'Targets',
        isActive: params.targets === 'true',
        iconClass: 'map__option__icon--targets',
    },
    {
        id: 'nonEndemicVillages',
        defaultMessage: 'Not endemic villages',
        isActive: params.nonEndemicVillages === 'true',
        iconClass: 'map__option__icon--villages',
    },
    {
        id: 'endemicVillages',
        defaultMessage: 'Endemic villages',
        isActive: params.endemicVillages === 'true',
        iconClass: 'map__option__icon--villages-with-case',
    },
];


export const itemsEditSitesToShow = [
    {
        id: 'main.label.sites',
        defaultMessage: 'Sites',
        key: 'sites',
        isActive: true,
        iconClass: 'map__option__icon--site',
    },
    {
        id: 'vector.labels.is_selected',
        defaultMessage: 'Selected traps',
        key: 'selected-traps',
        isActive: true,
        iconClass: 'map__option__icon--traps--selected',
    },
    {
        id: 'vector.labels.is_not_selected',
        defaultMessage: 'Not selected traps',
        key: 'not-selected-traps',
        isActive: true,
        iconClass: 'map__option__icon--traps--not-selected',
    },
];
