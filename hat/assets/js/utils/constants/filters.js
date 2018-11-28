import { selectWorkZone, selectProvince, selectZone, selectArea } from '../selectGeo';

const MESSAGES = {
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
                value: true,
            },
            {
                label: formatMessage(getMessage(defineMessages, 'negative')),
                value: false,
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
                value: true,
            },
            {
                label: formatMessage(getMessage(defineMessages, 'negative')),
                value: false,
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
};
