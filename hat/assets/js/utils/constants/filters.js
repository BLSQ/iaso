import { defineMessages } from 'react-intl';
import {
    selectWorkZone,
    selectProvince,
    selectZone,
    selectArea,
} from '../selectGeo';
import { treatmentsMedecineMessages } from '../../utils/constants/treatmentsMessages';

const tempTreatmentsMedecineMessages = {
    ...treatmentsMedecineMessages,
};
delete tempTreatmentsMedecineMessages.none;
export const MESSAGES = {
    positive: {
        defaultMessage: 'Positif',
        id: 'main.label.postive',
    },
    negative: {
        defaultMessage: 'Négatif',
        id: 'main.label.negative',
    },
    not_done: {
        defaultMessage: 'Non fait',
        id: 'main.label.not_done',
    },
    mobile_sync: {
        defaultMessage: 'Sync Tablette',
        id: 'main.label.mobile_sync',
    },
    mobile_backup: {
        defaultMessage: 'Backup Tablette',
        id: 'main.label.mobile_backup',
    },
    historic: {
        defaultMessage: 'Historique',
        id: 'main.label.historic',
    },
    pv: {
        defaultMessage: 'Pharmacovigilance',
        id: 'main.label.pv',
    },
    located: {
        defaultMessage: 'Uniquement les cas localisés',
        id: 'main.label.located',
    },
    notLocated: {
        defaultMessage: 'Uniquement les cas non localisés',
        id: 'main.label.notLocated',
    },
    notLocatedNotFound: {
        defaultMessage: 'Uniquement les cas non localisés et non trouvés',
        id: 'main.label.notLocatedNotFound',
    },
    test_lymph_node_puncture: {
        defaultMessage: 'Ponction noeud lymphatique',
        id: 'main.label.test_lymph_node_puncture',
    },
    sf: {
        defaultMessage: 'Sang frais',
        id: 'main.label.sf',
    },
    screener: {
        defaultMessage: 'Dépisteur',
        id: 'main.label.screener',
    },
    confirmer: {
        defaultMessage: 'Confirmateur',
        id: 'main.label.confirmer',
    },
    with_pictures: {
        defaultMessage: 'Avec images',
        id: 'main.label.with_pictures',
    },
    with_pictures_uploaded: {
        defaultMessage: 'Avec images envoyées',
        id: 'main.label.with_pictures_uploaded',
    },
    without_pictures_uploaded: {
        defaultMessage: 'Avec images mais non envoyées',
        id: 'main.label.without_pictures_uploaded',
    },
    with_videos: {
        defaultMessage: 'Avec vidéos',
        id: 'main.label.with_videos',
    },
    with_videos_uploaded: {
        defaultMessage: 'Avec vidéos envoyées',
        id: 'main.label.with_videos_uploaded',
    },
    without_videos_uploaded: {
        defaultMessage: 'Avec vidéos mais non envoyées',
        id: 'main.label.without_videos_uploaded',
    },
    without_pictures: {
        defaultMessage: 'Sans images',
        id: 'main.label.without_pictures',
    },
    without_videos: {
        defaultMessage: 'Sans vidéos',
        id: 'main.label.without_videos',
    },
    ignored: {
        defaultMessage: 'Ignorés',
        id: 'main.label.ignored',
    },
    not_ignored: {
        defaultMessage: 'Non ignorés',
        id: 'main.label.not_ignored',
    },
    assigned: {
        defaultMessage: 'Assignés',
        id: 'main.label.assigned',
    },
    not_assigned: {
        defaultMessage: 'Non assignés',
        id: 'main.label.not_assigned',
    },
    selected: {
        defaultMessage: 'Sélectionné',
        id: 'main.label.selected',
    },
    not_selected: {
        defaultMessage: 'Non sélectionné',
        id: 'main.label.not_selected',
    },
    active: {
        defaultMessage: 'Actif',
        id: 'main.label.active',
    },
    passive: {
        defaultMessage: 'Passif',
        id: 'main.label.passive',
    },
};

const getMessage = key => defineMessages(MESSAGES[key]);

const testType = formatMessage => (
    {
        name: 'test_type',
        urlKey: 'test_type',
        isMultiSelect: true,
        isClearable: true,
        options: [
            {
                label: 'CATT',
                value: 'catt',
            },
            {
                label: 'RDT',
                value: 'rdt',
            },
            {
                label: 'CTCWOO',
                value: 'ctcwoo',
            },
            // {
            //     label: 'GE',
            //     value: 'ge',
            // },
            // {
            //     label: 'LCR',
            //     value: 'lcr',
            // },
            // {
            //     label: formatMessage(getMessage('test_lymph_node_puncture')),
            //     value: 'lnp',
            // },
            // {
            //     label: formatMessage(getMessage('sf')),
            //     value: 'sf',
            // },
            {
                label: 'PG',
                value: 'pg',
            },
            {
                label: 'MAECT',
                value: 'maect',
            },
            {
                label: 'PL',
                value: 'pl',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.test_type',
            defaultMessage: 'Test(s) effectué(s)',
        },
        type: 'select',
    }
);

const testTypeImage = () => (
    {
        name: 'test_type_image',
        urlKey: 'test_type_image',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: 'CATT',
                value: 'catt',
            },
            {
                label: 'RDT',
                value: 'rdt',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.test_type_image',
            defaultMessage: 'Test(s) de dépistage effectué(s)',
        },
        type: 'select',
    }
);

const testTypeVideo = () => (
    {
        name: 'test_type_video',
        urlKey: 'test_type_video',
        isMultiSelect: true,
        isClearable: true,
        options: [
            {
                label: 'CTCWOO',
                value: 'ctcwoo',
            },
            {
                label: 'PG',
                value: 'pg',
            },
            {
                label: 'MAECT',
                value: 'maect',
            },
            {
                label: 'PL',
                value: 'pl',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.test_type_video',
            defaultMessage: 'Test(s) de confirmation effectué(s)',
        },
        type: 'select',
    }
);

const screeningResult = formatMessage => (
    {
        name: 'screening_result',
        urlKey: 'screening_result',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('positive')),
                value: 'true',
            },
            {
                label: formatMessage(getMessage('negative')),
                value: 'false',
            },
            {
                label: formatMessage(getMessage('not_done')),
                value: 'not_done',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.screening_result',
            defaultMessage: 'Dépistage',
        },
        type: 'select',
    }
);

const confirmationResult = formatMessage => (
    {
        name: 'confirmation_result',
        urlKey: 'confirmation_result',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('positive')),
                value: 'true',
            },
            {
                label: formatMessage(getMessage('negative')),
                value: 'false',
            },
            {
                label: formatMessage(getMessage('not_done')),
                value: 'not_done',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.confirmation_result',
            defaultMessage: 'Confirmation',
        },
        type: 'select',
    }
);

const source = formatMessage => (
    {
        name: 'source',
        urlKey: 'source',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('mobile_sync')),
                value: 'mobile_sync',
            },
            {
                label: formatMessage(getMessage('mobile_backup')),
                value: 'mobile_backup',
            },
            {
                label: formatMessage(getMessage('historic')),
                value: 'historic',
            },
            {
                label: formatMessage(getMessage('pv')),
                value: 'pv',
            },
        ],
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.source',
            defaultMessage: 'Source',
        },
        type: 'select',
    }
);

const teams = (teamsList, isMultiSelect = true) => (
    {
        name: isMultiSelect ? 'teams' : 'team_id',
        urlKey: isMultiSelect ? 'teams' : 'team_id',
        isMultiSelect,
        isClearable: true,
        options: teamsList,
        placeholder: {
            id: 'cases.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.confirmation_result',
            defaultMessage: 'Equipe',
        },
        type: 'select',
    }
);

const located = formatMessage => (
    {
        name: 'located',
        urlKey: 'located',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('located')),
                value: 'only_located',
            },
            {
                label: formatMessage(getMessage('notLocated')),
                value: 'only_not_located',
            },
            {
                label: formatMessage(getMessage('notLocatedNotFound')),
                value: 'only_not_located_and_not_found',
            },
        ],
        placeholder: {
            id: 'cases.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.located',
            defaultMessage: 'Localisations',
        },
        type: 'select',
    }
);

const searchLastname = component => (
    {
        name: 'search_lastname',
        urlKey: 'search_lastname',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByName',
            defaultMessage: 'Recherche par nom',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

const searchName = component => (
    {
        name: 'search_name',
        urlKey: 'search_name',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByPostName',
            defaultMessage: 'Recherche par postnom',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

const searchPrename = component => (
    {
        name: 'search_prename',
        urlKey: 'search_prename',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByPrename',
            defaultMessage: 'Recherche par prénom',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

const searchMotherName = component => (
    {
        name: 'search_mother_name',
        urlKey: 'search_mother_name',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.motherName',
            defaultMessage: 'Recherche par le nom de la mère',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

const searchUuid = component => (
    {
        name: 'searchUuid',
        urlKey: 'searchUuid',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByUuid',
            defaultMessage: 'Recherche par Uid',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

const coordinations = (coordinationsList, isMultiSelect = true) => (
    {
        name: 'coordination_id',
        urlKey: 'coordination_id',
        isMultiSelect,
        isClearable: true,
        options: coordinationsList,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.coordination',
            defaultMessage: 'Coordination',
        },
        type: 'select',
    }
);

const workZones = (workzonesList, props, urlKey) => (
    {
        name: 'workzone_id',
        urlKey: 'workzone_id',
        isMultiSelect: false,
        isClearable: true,
        options: workzonesList,
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.workzones',
            defaultMessage: 'Rayons d\'actions',
        },
        type: 'select',
        callback: value => selectWorkZone(workzonesList, value, props, urlKey),
    }
);


const provinces = (provincesList, props, urlKey) => (
    {
        name: 'province_id',
        urlKey: 'province_id',
        isMultiSelect: true,
        isClearable: true,
        options: provincesList,
        isDisabled: props.params.workzone_id && props.params.workzone_id.length > 0,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.provinces',
            defaultMessage: 'Provinces',
        },
        type: 'select',
        callback: value => selectProvince(value, props, urlKey),
    }
);


const zones = (zoneslist, props, urlKey) => (
    {
        name: 'zs_id',
        urlKey: 'zs_id',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: zoneslist,
        isDisabled: props.params.workzone_id && props.params.workzone_id.length > 0,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.zones',
            defaultMessage: 'Zones de santé',
        },
        type: 'select',
        callback: value => selectZone(value, props, urlKey),
    }
);


const aires = (areasList, props, urlKey) => (
    {
        name: 'as_id',
        urlKey: 'as_id',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: areasList,
        isDisabled: props.params.workzone_id && props.params.workzone_id.length > 0,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.areas',
            defaultMessage: 'Aire de santé',
        },
        type: 'select',
        callback: value => selectArea(value, props, urlKey),
    }
);

const villages = villagesList => (
    {
        name: 'village_id',
        urlKey: 'village_id',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: villagesList,
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.village',
            defaultMessage: 'Villages',
        },
        type: 'select',
    }
);

const onlyDupes = () => (
    {
        name: 'only_dupes',
        urlKey: 'only_dupes',
        label: {
            id: 'main.label.onlyDupes',
            defaultMessage: 'Uniquement avec Doublons',
        },
        type: 'checkbox',
    }
);

const users = (
    usersList,
    mainLabel = {
        id: 'main.label.user',
        defaultMessage: 'Utilisateurs',
    },
    isMultiSelect = true,
    urlKey = 'userId',
    placeholderLabel = {
        id: 'main.label.allMale',
        defaultMessage: 'Tous',
    },
) => (
    {
        name: urlKey,
        urlKey,
        hideEmpty: true,
        isMultiSelect,
        isClearable: true,
        options: usersList.map((p) => {
            let label = p.user__username;
            if (p.user__first_name || p.user__last_name) {
                label += ` (${p.user__first_name}${p.user__last_name ? ` ${p.user__last_name}` : ''})`;
            }
            return ({
                label,
                value: p.user__id,
            });
        }),
        placeholder: placeholderLabel,
        label: mainLabel,
        type: 'select',
    }
);

const habitats = (formatMessage, habitatsList) => (
    {
        name: 'habitats',
        urlKey: 'habitats',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: habitatsList.map(h =>
            ({
                label: formatMessage({
                    defaultMessage: h[1],
                    id: `vectors.label.${h[0]}`,
                }),
                value: h[0],
            })),
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'main.label.habitats',
            defaultMessage: 'Habitats (pièges uniquement)',
        },
        type: 'select',
    }
);

const sites = formatMessage => (
    {
        name: 'sitesFilter',
        urlKey: 'sitesFilter',
        hideEmpty: true,
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('ignored')),
                value: 'ignored',
            },
            {
                label: formatMessage(getMessage('not_ignored')),
                value: 'not_ignored',
            },
            {
                label: formatMessage(getMessage('assigned')),
                value: 'assigned',
            },
            {
                label: formatMessage(getMessage('not_assigned')),
                value: 'not_assigned',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'vector.label.sites',
            defaultMessage: 'Sites',
        },
        type: 'select',
    }
);

const traps = formatMessage => (
    {
        name: 'trapsFilter',
        urlKey: 'trapsFilter',
        hideEmpty: true,
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('ignored')),
                value: 'ignored',
            },
            {
                label: formatMessage(getMessage('not_ignored')),
                value: 'not_ignored',
            },
            {
                label: formatMessage(getMessage('selected')),
                value: 'selected',
            },
            {
                label: formatMessage(getMessage('not_selected')),
                value: 'not_selected',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'vector.label.traps',
            defaultMessage: 'Pièges',
        },
        type: 'select',
    }
);

const targets = formatMessage => (
    {
        name: 'targetsFilter',
        urlKey: 'targetsFilter',
        hideEmpty: true,
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('ignored')),
                value: 'ignored',
            },
            {
                label: formatMessage(getMessage('not_ignored')),
                value: 'not_ignored',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'vector.label.targets',
            defaultMessage: 'Ecrans',
        },
        type: 'select',
    }
);


const medecine = formatMessage => (
    {
        name: 'treatment_medicine',
        urlKey: 'treatment_medicine',
        hideEmpty: true,
        isMultiSelect: false,
        isClearable: true,
        options: Object.keys(tempTreatmentsMedecineMessages).map(key =>
            ({ label: formatMessage(tempTreatmentsMedecineMessages[key]), value: key })),
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'main.label.medecine',
            defaultMessage: 'Type de traitement',
        },
        type: 'select',
    }
);

const onlyTreatedPatients = () => (
    {
        name: 'with_treatment',
        urlKey: 'with_treatment',
        label: {
            id: 'main.label.onlyTreatedPatients',
            defaultMessage: 'Avec traitement(s)',
        },
        type: 'checkbox',
        conditionnalCheck: 'treatment_medicine',
    }
);

const onlyDead = () => (
    {
        name: 'dead',
        urlKey: 'dead',
        label: {
            id: 'main.label.onlyDead',
            defaultMessage: 'Décédés',
        },
        type: 'checkbox',
    }
);

const testerType = formatMessage => (
    {
        name: 'tester_type',
        urlKey: 'tester_type',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('screener')),
                value: 'screener',
            },
            {
                label: formatMessage(getMessage('confirmer')),
                value: 'confirmer',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.tester_type',
            defaultMessage: 'Type de testeur',
        },
        type: 'select',
    }
);

const withTestDevices = () => (
    {
        name: 'with_tests_devices',
        urlKey: 'with_tests_devices',
        label: {
            id: 'main.label.with_tests_devices',
            defaultMessage: 'Inclure les tablettes de test',
        },
        type: 'checkbox',
    }
);

const device = devicesList => (
    {
        name: 'device_id',
        urlKey: 'device_id',
        isMultiSelect: true,
        isClearable: true,
        options: devicesList.map(d => ({
            label: `${d.device_id} ${d.last_user ? ` (${d.last_user})` : ''} `,
            value: d.device_id,
        })),
        placeholder: {
            id: 'cases.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'main.label.devices',
            defaultMessage: 'Tablette',
        },
        type: 'select',
    }
);

const images = formatMessage => (
    {
        name: 'pictures',
        urlKey: 'pictures',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('with_pictures')),
                value: 'with_pictures',
            },
            {
                label: formatMessage(getMessage('with_pictures_uploaded')),
                value: 'with_pictures_uploaded',
            },
            {
                label: formatMessage(getMessage('without_pictures_uploaded')),
                value: 'without_pictures_uploaded',
            },
            {
                label: formatMessage(getMessage('without_pictures')),
                value: 'without_pictures',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'main.label.pictures',
            defaultMessage: 'Images',
        },
        type: 'select',
    }
);


const videos = formatMessage => (
    {
        name: 'videos',
        urlKey: 'videos',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('with_videos')),
                value: 'with_videos',
            },
            {
                label: formatMessage(getMessage('with_videos_uploaded')),
                value: 'with_videos_uploaded',
            },
            {
                label: formatMessage(getMessage('without_videos_uploaded')),
                value: 'without_videos_uploaded',
            },
            {
                label: formatMessage(getMessage('without_videos')),
                value: 'without_videos',
            },
        ],
        placeholder: {
            id: 'cases.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'main.label.videos',
            defaultMessage: 'Vidéos',
        },
        type: 'select',
    }
);

const onlyCheckedTests = () => (
    {
        name: 'only_checked_tests',
        urlKey: 'only_checked_tests',
        label: {
            id: 'main.label.onlyCheckedTests',
            defaultMessage: 'Uniquement les test vérifiés',
        },
        type: 'checkbox',
    }
);

const teamType = (formatMessage, teamTypeList, label = {
    id: 'main.label.team_type',
    defaultMessage: 'Type d\'équipe',
}, placeholder = {
    id: 'cases.label.all',
    defaultMessage: 'Toutes',
}) => (
    {
        name: 'team_type',
        urlKey: 'team_type',
        isMultiSelect: false,
        isClearable: true,
        options: teamTypeList,
        placeholder,
        label,
        type: 'select',
    }
);

const screenTeamType = () => (
    {
        name: 'type',
        urlKey: 'type',
        isMultiSelect: false,
        isClearable: true,
        options: [
            { label: 'UM', value: 'UM' },
            { label: 'MUM', value: 'MUM' },
        ],
        placeholder: {
            id: 'cases.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'main.label.screening_team_type',
            defaultMessage: 'Type de dépistage',
        },
        type: 'select',
    }
);

const anonymous = () => (
    {
        name: 'anonymous',
        urlKey: 'anonymous',
        label: {
            id: 'main.label.anonymousDownload',
            defaultMessage: 'Données anonymisées',
        },
        type: 'checkbox',
    }
);

const institutions = (institutionsList, isMultiSelect = false) => (
    {
        name: 'institution_id',
        urlKey: 'institution_id',
        isMultiSelect,
        isClearable: true,
        options: institutionsList.map(institution =>
            ({ label: institution.name, value: institution.id })),
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'Toutes',
        },
        label: {
            id: 'cases.label.institution',
            defaultMessage: 'Institution',
        },
        type: 'select',
    }
);

const problems = (formatMessage, problemsList) => (
    {
        name: 'problems',
        urlKey: 'problems',
        isMultiSelect: true,
        isClearable: true,
        options: problemsList.map(h =>
            ({
                label: formatMessage({
                    defaultMessage: h[1],
                    id: `vectors.label.${h[0]}`,
                }),
                value: h[0],
            })),
        placeholder: {
            id: 'cases.label.none',
            defaultMessage: 'Aucun',
        },
        label: {
            id: 'cases.label.problems',
            defaultMessage: 'Problèmes (déploiements uniquement)',
        },
        type: 'select',
    }
);

const screeningType = formatMessage => (
    {
        name: 'screening_type',
        urlKey: 'screening_type',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('active')),
                value: 'active',
            },
            {
                label: formatMessage(getMessage('passive')),
                value: 'passive',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'cases.label.screening_type',
            defaultMessage: 'Type de dépistage',
        },
        type: 'select',
    }
);

export {
    testType,
    testTypeImage,
    testTypeVideo,
    screeningResult,
    confirmationResult,
    source,
    teams,
    located,
    searchLastname,
    searchName,
    searchPrename,
    searchUuid,
    coordinations,
    workZones,
    provinces,
    zones,
    aires,
    villages,
    searchMotherName,
    onlyDupes,
    users,
    habitats,
    sites,
    traps,
    targets,
    medecine,
    onlyTreatedPatients,
    onlyDead,
    testerType,
    withTestDevices,
    device,
    images,
    videos,
    onlyCheckedTests,
    anonymous,
    teamType,
    screenTeamType,
    institutions,
    screeningType,
    problems,
};
