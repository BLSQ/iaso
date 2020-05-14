import {
    selectWorkZone,
    selectProvince,
    selectZone,
    selectArea,
} from '../selectGeo';
import { treatmentsMedecineMessages } from './treatmentsMessages';

import testTypes from './testTypes';

const tempTreatmentsMedecineMessages = {
    ...treatmentsMedecineMessages,
};
delete tempTreatmentsMedecineMessages.none;
export const MESSAGES = {
    positive: {
        defaultMessage: 'Positive',
        id: 'main.label.positive',
    },
    negative: {
        defaultMessage: 'Negative',
        id: 'main.label.negative',
    },
    not_done: {
        defaultMessage: 'Not done',
        id: 'main.label.not_done',
    },
    mobile_sync: {
        defaultMessage: 'Tablet sync',
        id: 'main.label.mobile_sync',
    },
    mobile_backup: {
        defaultMessage: 'Tablet back up',
        id: 'main.label.mobile_backup',
    },
    historic: {
        defaultMessage: 'Historic',
        id: 'main.label.historic',
    },
    pv: {
        defaultMessage: 'Pharmacovigilance',
        id: 'main.label.pv',
    },
    located: {
        defaultMessage: 'Only located cases',
        id: 'main.label.located',
    },
    notLocated: {
        defaultMessage: 'Only not located cases',
        id: 'main.label.notLocated',
    },
    notLocatedNotFound: {
        defaultMessage: 'Only not located and not found cases',
        id: 'main.label.notLocatedNotFound',
    },
    screener: {
        defaultMessage: 'Screener',
        id: 'main.label.screener',
    },
    confirmer: {
        defaultMessage: 'Confirmateur',
        id: 'main.label.confirmer',
    },
    with_pictures: {
        defaultMessage: 'With images',
        id: 'main.label.with_pictures',
    },
    with_pictures_uploaded: {
        defaultMessage: 'With uploaded pictures',
        id: 'main.label.with_pictures_uploaded',
    },
    without_pictures_uploaded: {
        defaultMessage: 'With pictures but not uploaded',
        id: 'main.label.without_pictures_uploaded',
    },
    with_videos: {
        defaultMessage: 'With videos',
        id: 'main.label.with_videos',
    },
    with_videos_uploaded: {
        defaultMessage: 'Wiht uploaded videos',
        id: 'main.label.with_videos_uploaded',
    },
    without_videos_uploaded: {
        defaultMessage: 'With videos but not uploaded',
        id: 'main.label.without_videos_uploaded',
    },
    without_pictures: {
        defaultMessage: 'Without pictures',
        id: 'main.label.without_pictures',
    },
    without_videos: {
        defaultMessage: 'Without videos',
        id: 'main.label.without_videos',
    },
    ignored: {
        defaultMessage: 'Ignored',
        id: 'main.label.ignored',
    },
    not_ignored: {
        defaultMessage: 'Not ignored',
        id: 'main.label.not_ignored',
    },
    assigned: {
        defaultMessage: 'Assigned',
        id: 'main.label.assigned',
    },
    not_assigned: {
        defaultMessage: 'Not assigned',
        id: 'main.label.not_assigned',
    },
    selected: {
        defaultMessage: 'Selected',
        id: 'main.label.selected',
    },
    not_selected: {
        defaultMessage: 'Not selected',
        id: 'main.label.not_selected',
    },
    active: {
        defaultMessage: 'Active',
        id: 'main.label.active',
    },
    passive: {
        defaultMessage: 'Passive',
        id: 'main.label.passive',
    },
    stage1: {
        defaultMessage: 'Stage 1',
        id: 'main.label.stage1',
    },
    stage2: {
        defaultMessage: 'Stage 2',
        id: 'main.label.stage2',
    },
    unknown: {
        defaultMessage: 'Unknown',
        id: 'main.label.unknown',
    },
};

const getMessage = key => MESSAGES[key];

export const testType = (
    formatMessage,
    label = {
        id: 'main.label.test_type',
        defaultMessage: 'Test(s) done',
    },
    isMultiSelect = true,
    placeholder = {
        id: 'main.label.allMale',
        defaultMessage: 'All',
    },
) => (
    {
        name: 'test_type',
        urlKey: 'test_type',
        isMultiSelect,
        isClearable: true,
        options: testTypes.map(tt => ({
            label: formatMessage(tt.label),
            value: tt.key,
        })),
        placeholder,
        label,
        type: 'select',
    }
);

export const testTypeImage = () => (
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
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.test_type_image',
            defaultMessage: 'Screening test(s) done',
        },
        type: 'select',
    }
);

export const testTypeVideo = () => (
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
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.test_type_video',
            defaultMessage: 'Confirmation test(s) done',
        },
        type: 'select',
    }
);

export const screeningResult = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.screening_result',
            defaultMessage: 'Screening',
        },
        type: 'select',
    }
);

export const confirmationResult = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.confirmation_result',
            defaultMessage: 'Confirmation',
        },
        type: 'select',
    }
);

export const source = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.source',
            defaultMessage: 'Source',
        },
        type: 'select',
    }
);

export const teams = (teamsList, isMultiSelect = true) => (
    {
        name: isMultiSelect ? 'teams' : 'team_id',
        urlKey: isMultiSelect ? 'teams' : 'team_id',
        isMultiSelect,
        isClearable: true,
        options: teamsList,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.team',
            defaultMessage: 'Team',
        },
        type: 'select',
    }
);

export const located = formatMessage => (
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
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.locations',
            defaultMessage: 'Localisations',
        },
        type: 'select',
    }
);

export const searchLastname = component => (
    {
        name: 'search_lastname',
        urlKey: 'search_lastname',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Search',
        },
        label: {
            id: 'main.label.searchByName',
            defaultMessage: 'Search by last name',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

export const searchPostName = component => (
    {
        name: 'search_postname',
        urlKey: 'search_postname',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Search',
        },
        label: {
            id: 'main.label.searchByPostName',
            defaultMessage: 'Search by post name',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

export const searchPrename = component => (
    {
        name: 'search_prename',
        urlKey: 'search_prename',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Search',
        },
        label: {
            id: 'main.label.searchByPrename',
            defaultMessage: 'Search by first name',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

export const searchMotherName = component => (
    {
        name: 'search_mother_name',
        urlKey: 'search_mother_name',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Search',
        },
        label: {
            id: 'main.label.searchByMotherName',
            defaultMessage: 'Search by mother name',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

export const searchUuid = component => (
    {
        name: 'searchUuid',
        urlKey: 'searchUuid',
        allowEmptySearch: true,
        showResetSearch: true,
        displayResults: false,
        displayIcon: false,
        placeholder: {
            id: 'main.label.search',
            defaultMessage: 'Search',
        },
        label: {
            id: 'main.label.searchByUuid',
            defaultMessage: 'Search by Uid',
        },
        type: 'search',
        onKeyPressed: () => component.onSearch(),
    }
);

export const coordinations = (coordinationsList, isMultiSelect = true) => (
    {
        name: 'coordination_id',
        urlKey: 'coordination_id',
        isMultiSelect,
        isClearable: true,
        options: coordinationsList,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.coordination',
            defaultMessage: 'Coordination',
        },
        type: 'select',
    }
);

export const workZones = (workzonesList, props, urlKey) => (
    {
        name: 'workzone_id',
        urlKey: 'workzone_id',
        isMultiSelect: false,
        isClearable: true,
        options: workzonesList,
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.workzones',
            defaultMessage: 'Work zones',
        },
        type: 'select',
        callback: value => selectWorkZone(workzonesList, value, props, urlKey),
    }
);


export const provinces = (provincesList, props, urlKey) => (
    {
        name: 'province_id',
        urlKey: 'province_id',
        isMultiSelect: true,
        isClearable: true,
        options: provincesList,
        isDisabled: props.params.workzone_id && props.params.workzone_id.length > 0,
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.provinces',
            defaultMessage: 'Provinces',
        },
        type: 'select',
        callback: value => selectProvince(value, props, urlKey),
    }
);


export const zones = (zoneslist, props, urlKey) => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.zones',
            defaultMessage: 'Health zones',
        },
        type: 'select',
        callback: value => selectZone(value, props, urlKey),
    }
);


export const aires = (areasList, props, urlKey) => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.areas',
            defaultMessage: 'Health areas',
        },
        type: 'select',
        callback: value => selectArea(value, props, urlKey),
    }
);

export const villages = (villagesList, displayEmpyLabel) => (
    {
        name: 'village_id',
        urlKey: 'village_id',
        hideEmpty: true,
        isMultiSelect: true,
        isClearable: true,
        options: villagesList,
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.villages',
            defaultMessage: 'Villages',
        },
        emptyLabel: displayEmpyLabel ? {
            id: 'main.label.noVillage',
            defaultMessage: 'No village',
        } : null,
        type: 'select',
    }
);

export const onlyDupes = () => (
    {
        name: 'only_dupes',
        urlKey: 'only_dupes',
        label: {
            id: 'main.label.onlyDupes',
            defaultMessage: 'Only duplicates',
        },
        type: 'checkbox',
    }
);

export const showDeleted = () => (
    {
        name: 'showDeleted',
        urlKey: 'showDeleted',
        label: {
            id: 'main.cases.showDeleted',
            defaultMessage: 'Show marked for deletion',
        },
        type: 'checkbox',
    }
);
export const showUnDeleted = () => (
    {
        name: 'showUnDeleted',
        urlKey: 'showUnDeleted',
        label: {
            id: 'main.cases.showUnDeleted',
            defaultMessage: 'Show not marked for deletion',
        },
        type: 'checkbox',
    }
);

export const users = (
    usersList,
    mainLabel = {
        id: 'main.label.users',
        defaultMessage: 'Users',
    },
    isMultiSelect = true,
    urlKey = 'userId',
    placeholderLabel = {
        id: 'main.label.allMale',
        defaultMessage: 'All',
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

export const habitats = (formatMessage, habitatsList) => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.habitats',
            defaultMessage: 'Habitats (only traps)',
        },
        type: 'select',
    }
);

export const sites = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.sites',
            defaultMessage: 'Sites',
        },
        type: 'select',
    }
);

export const traps = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.traps',
            defaultMessage: 'Traps',
        },
        type: 'select',
    }
);

export const targets = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.targets',
            defaultMessage: 'targets',
        },
        type: 'select',
    }
);


export const medecine = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.medecine',
            defaultMessage: 'Type of medecine',
        },
        type: 'select',
    }
);

export const onlyTreatedPatients = () => (
    {
        name: 'with_treatment',
        urlKey: 'with_treatment',
        label: {
            id: 'main.label.onlyTreatedPatients',
            defaultMessage: 'With treatment(s)',
        },
        type: 'checkbox',
        conditionnalCheck: 'treatment_medicine',
    }
);

export const onlyDead = () => (
    {
        name: 'dead',
        urlKey: 'dead',
        label: {
            id: 'main.label.onlyDead',
            defaultMessage: 'Deceased',
        },
        type: 'checkbox',
    }
);

export const testerType = formatMessage => (
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
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.tester_type',
            defaultMessage: 'Type de testeur',
        },
        type: 'select',
    }
);

export const withTestDevices = () => (
    {
        name: 'with_tests_devices',
        urlKey: 'with_tests_devices',
        label: {
            id: 'main.label.with_tests_devices',
            defaultMessage: 'With tests devices',
        },
        type: 'checkbox',
    }
);

export const device = devicesList => (
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
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.devices',
            defaultMessage: 'Tablet',
        },
        type: 'select',
    }
);

export const images = formatMessage => (
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
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.images',
            defaultMessage: 'Images',
        },
        type: 'select',
    }
);


export const videos = formatMessage => (
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
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.videos',
            defaultMessage: 'Videos',
        },
        type: 'select',
    }
);

export const onlyCheckedTests = () => (
    {
        name: 'only_checked_tests',
        urlKey: 'only_checked_tests',
        label: {
            id: 'main.label.onlyCheckedTests',
            defaultMessage: 'Only checked texts',
        },
        type: 'checkbox',
    }
);

export const teamType = (formatMessage, teamTypeList, label = {
    id: 'main.label.team_type',
    defaultMessage: 'Team type',
}, placeholder = {
    id: 'main.label.all',
    defaultMessage: 'All',
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

export const screenTeamType = () => (
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
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.screening_team_type',
            defaultMessage: 'Screening type',
        },
        type: 'select',
    }
);

export const anonymous = () => (
    {
        name: 'anonymous',
        urlKey: 'anonymous',
        label: {
            id: 'main.label.anonymousDownload',
            defaultMessage: 'Anonymous data',
        },
        type: 'checkbox',
    }
);

export const institutions = (institutionsList, isMultiSelect = false) => (
    {
        name: 'institution_id',
        urlKey: 'institution_id',
        isMultiSelect,
        isClearable: true,
        options: institutionsList.map(institution =>
            ({ label: institution.name, value: institution.id })),
        placeholder: {
            id: 'main.label.all',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.institution',
            defaultMessage: 'Institution',
        },
        type: 'select',
    }
);

export const problems = (formatMessage, problemsList) => (
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
            id: 'main.label.none',
            defaultMessage: 'None',
        },
        label: {
            id: 'main.label.targetsProblems',
            defaultMessage: 'Problems (only targets)',
        },
        type: 'select',
    }
);

export const screeningType = formatMessage => (
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
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.screening_type',
            defaultMessage: 'Screening type',
        },
        type: 'select',
    }
);

export const stage = formatMessage => (
    {
        name: 'stage',
        urlKey: 'stage',
        isMultiSelect: false,
        isClearable: true,
        options: [
            {
                label: formatMessage(getMessage('stage1')),
                value: 'stage1',
            },
            {
                label: formatMessage(getMessage('stage2')),
                value: 'stage2',
            },
            {
                label: formatMessage(getMessage('unknown')),
                value: 'unknown',
            },
        ],
        placeholder: {
            id: 'main.label.allMale',
            defaultMessage: 'All',
        },
        label: {
            id: 'main.label.stage',
            defaultMessage: 'Stage',
        },
        type: 'select',
    }
);

export const activeUsers = (disabled = false) => (
    {
        name: 'active',
        urlKey: 'active',
        disabled,
        label: {
            id: 'main.label.usersActive',
            defaultMessage: 'Active users',
        },
        type: 'checkbox',
    }
);

export const inactiveUsers = (disabled = false) => (
    {
        name: 'inactive',
        urlKey: 'inactive',
        disabled,
        label: {
            id: 'main.label.usersInactive',
            defaultMessage: 'Inactive users',
        },
        type: 'checkbox',
    }
);
