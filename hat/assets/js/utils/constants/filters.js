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
};

const getMessage = (defineMessages, key) => defineMessages(MESSAGES[key]);

const testType = (formatMessage, defineMessages) => (
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
            //     label: formatMessage(getMessage(defineMessages, 'test_lymph_node_puncture')),
            //     value: 'lnp',
            // },
            // {
            //     label: formatMessage(getMessage(defineMessages, 'sf')),
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

const screeningResult = (formatMessage, defineMessages) => (
    {
        name: 'screening_result',
        urlKey: 'screening_result',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'positive')),
                value: 'true',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'negative')),
                value: 'false',
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

const confirmationResult = (formatMessage, defineMessages) => (
    {
        name: 'confirmation_result',
        urlKey: 'confirmation_result',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'positive')),
                value: 'true',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'negative')),
                value: 'false',
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

const source = (formatMessage, defineMessages) => (
    {
        name: 'source',
        urlKey: 'source',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'mobile_sync')),
                value: 'mobile_sync',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'mobile_backup')),
                value: 'mobile_backup',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'historic')),
                value: 'historic',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'pv')),
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


const teams = teamsList => (
    {
        name: 'teams',
        urlKey: 'teams',
        isMultiSelect: true,
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

const located = (formatMessage, defineMessages) => (
    {
        name: 'located',
        urlKey: 'located',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'located')),
                value: 'only_located',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'notLocated')),
                value: 'only_not_located',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'notLocatedNotFound')),
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

const searchLastname = () => (
    {
        name: 'search_lastname',
        urlKey: 'search_lastname',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByName',
            defaultMessage: 'Recherche par nom',
        },
        type: 'search',
    }
);

const searchName = () => (
    {
        name: 'search_name',
        urlKey: 'search_name',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByPostName',
            defaultMessage: 'Recherche par postnom',
        },
        type: 'search',
    }
);

const searchPrename = () => (
    {
        name: 'search_prename',
        urlKey: 'search_prename',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.searchByPrename',
            defaultMessage: 'Recherche par prénom',
        },
        type: 'search',
    }
);

const searchMotherName = () => (
    {
        name: 'search_mother_name',
        urlKey: 'search_mother_name',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Recherche',
        },
        label: {
            id: 'cases.label.motherName',
            defaultMessage: 'Recherche par le nom de la mère',
        },
        type: 'search',
    }
);
const coordinations = coordinationsList => (
    {
        name: 'coordination_id',
        urlKey: 'coordination_id',
        isMultiSelect: true,
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

const users = usersList => (
    {
        name: 'userId',
        urlKey: 'userId',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: usersList.map(p =>
            ({ label: p.user__username, value: p.user__id })),
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'Tous',
        },
        label: {
            id: 'main.label.user',
            defaultMessage: 'Utilisateurs',
        },
        type: 'select',
    }
);

const habitats = (formatMessage, messages, habitatsList) => (
    {
        name: 'habitats',
        urlKey: 'habitats',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: habitatsList.map(h =>
            ({ label: formatMessage(messages[h[0]]), value: h[0] })),
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

const onlyReferenceTraps = () => (
    {
        name: 'onlyReferenceTraps',
        urlKey: 'onlyReferenceTraps',
        label: {
            id: 'main.label.onlyReferenceTraps',
            defaultMessage: 'Pièges de références',
        },
        type: 'checkbox',
    }
);

const onlyIgnoredTraps = () => (
    {
        name: 'onlyIgnoredTraps',
        urlKey: 'onlyIgnoredTraps',
        label: {
            id: 'main.label.onlyIgnoredTraps',
            defaultMessage: 'Pièges ignorés',
        },
        type: 'checkbox',
    }
);

const onlyIgnoredTargets = () => (
    {
        name: 'onlyIgnoredTargets',
        urlKey: 'onlyIgnoredTargets',
        label: {
            id: 'main.label.onlyIgnoredTargets',
            defaultMessage: 'Ecrans ignorés',
        },
        type: 'checkbox',
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

const testerType = (formatMessage, defineMessages) => (
    {
        name: 'tester_type',
        urlKey: 'tester_type',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'screener')),
                value: 'screener',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'confirmer')),
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

const images = (formatMessage, defineMessages) => (
    {
        name: 'pictures',
        urlKey: 'pictures',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'with_pictures')),
                value: 'with_pictures',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'with_pictures_uploaded')),
                value: 'with_pictures_uploaded',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'without_pictures_uploaded')),
                value: 'without_pictures_uploaded',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'without_pictures')),
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


const videos = (formatMessage, defineMessages) => (
    {
        name: 'videos',
        urlKey: 'videos',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage(defineMessages, 'with_videos')),
                value: 'with_videos',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'with_videos_uploaded')),
                value: 'with_videos_uploaded',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'without_videos_uploaded')),
                value: 'without_videos_uploaded',
            },
            {
                label: formatMessage(getMessage(defineMessages, 'without_videos')),
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


export {
    testType,
    screeningResult,
    confirmationResult,
    source,
    teams,
    located,
    searchLastname,
    searchName,
    searchPrename,
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
    onlyReferenceTraps,
    onlyIgnoredTraps,
    onlyIgnoredTargets,
    medecine,
    onlyTreatedPatients,
    onlyDead,
    testerType,
    withTestDevices,
    device,
    images,
    videos,
};
