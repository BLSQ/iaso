import React from 'react';
import { getParamsKey } from 'bluesquare-components';
import MESSAGES from '../domains/forms/messages';
import FullStarsSvg from '../components/stars/FullStarsSvgComponent';
import getDisplayName from '../utils/usersUtils.ts';
import { usePrettyPeriod } from '../domains/periods/utils';
import { orgUnitLabelString } from '../domains/orgUnits/utils';
import { capitalize } from '../utils/index';

export const forbiddenCharacters = ['"', '?', '/', '%', '&'];

export const containsForbiddenCharacter = value => {
    for (let i = 0; i < value.length; i += 1) {
        if (forbiddenCharacters.includes(value[i])) return true;
    }
    return false;
};

export const search = (urlKey = 'search') => ({
    urlKey,
    label: MESSAGES.textSearch,
    type: 'search',
});

export const status = (
    validationStatusOptions,
    isLoadingValidationStatusOptions,
) => ({
    urlKey: 'validation_status',
    isMultiSelect: false,
    isClearable: false,
    options: validationStatusOptions,
    label: MESSAGES.validationStatus,
    type: 'select',
    loading: isLoadingValidationStatusOptions,
});

export const linkStatus = formatMessage => ({
    urlKey: 'validated',
    isMultiSelect: false,
    isClearable: true,
    options: [
        {
            label: formatMessage(MESSAGES.validated),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.notValidated),
            value: 'false',
        },
    ],
    label: MESSAGES.validationStatus,
    type: 'select',
});
export const hasInstances = (formatMessage, urlKey = 'hasInstances') => ({
    urlKey,
    isMultiSelect: false,
    isClearable: true,
    options: [
        {
            label: formatMessage(MESSAGES.with),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.without),
            value: 'false',
        },
        {
            label: formatMessage(MESSAGES.duplicates),
            value: 'duplicates',
        },
    ],
    label: MESSAGES.hasInstances,
    type: 'select',
});

export const orgUnitLevel = (
    orgunitList,
    level,
    callback,
    value,
    formatMessage,
) => ({
    urlKey: 'levels',
    isMultiSelect: false,
    useKeyParam: false,
    isClearable: true,
    options: orgunitList.map(o => ({
        label: orgUnitLabelString(o, true, formatMessage),
        value: o.id,
    })),
    labelString: `${formatMessage(MESSAGES.level)} ${level + 1}`,
    type: 'select',
    callback,
    value,
});

export const orgUnitType = ({
    orgUnitTypes,
    urlKey = 'orgUnitTypeId',
    labelString = '',
    label = MESSAGES.org_unit_type_id,
}) => {
    return {
        urlKey,
        isMultiSelect: true,
        isClearable: true,
        options: orgUnitTypes.map(t => ({
            label: t.name,
            value: t.id,
        })),
        label: labelString !== '' ? null : label,
        type: 'select',
        labelString,
    };
};

const renderColoredOption = item => (
    <div>
        <span
            style={{ backgroundColor: item.color }}
            className="select-color"
        />
        {item.name}
    </div>
);

export const source = (
    sourceList,
    isMultiSelect = false,
    displayColor = false,
    urlKey = 'source',
    labelString = '',
    label = MESSAGES.source,
) => ({
    urlKey,
    isMultiSelect,
    displayColor,
    isClearable: true,
    options: sourceList?.map(s => ({
        label: displayColor ? renderColoredOption(s) : s.name,
        value: s.id,
    })),

    label: labelString !== '' ? null : label,
    type: 'select',
    labelString,
});

export const subSource = (formatMessage, sourceList) => ({
    urlKey: 'sourceId',
    isMultiSelect: false,
    isClearable: true,
    options: sourceList.map(t => ({
        label: formatMessage(MESSAGES[t[0]]),
        value: t[0],
    })),
    label: MESSAGES.subSource,
    type: 'select',
});

export const device = deviceList => ({
    urlKey: 'deviceId',
    isMultiSelect: false,
    isClearable: true,
    options: deviceList.map(d => ({
        label: d.imei,
        value: d.id,
    })),
    label: MESSAGES.device,
    type: 'select',
});

export const deviceOwnership = deviceOnershipList => ({
    urlKey: 'deviceOwnershipId',
    isMultiSelect: false,
    isClearable: true,
    options: deviceOnershipList.map(o => ({
        label: `${getDisplayName(o.user)} - IMEI:${o.device.imei}`,
        value: o.id,
    })),
    label: MESSAGES.deviceOwnership,
    type: 'select',
});

export const validator = profileList => ({
    urlKey: 'validatorId',
    isMultiSelect: false,
    isClearable: true,
    options: profileList.map(u => ({
        label: u.user_name,
        value: u.id,
    })),
    label: MESSAGES.validator,
    type: 'select',
});

export const profile = (
    profileList,
    isMultiSelect = false,
    urlKey = 'profile',
    labelString = '',
    label = MESSAGES.profile,
) => ({
    urlKey,
    isMultiSelect,
    isClearable: true,
    options: profileList.map(u => ({
        label: u.user_name,
        value: u.id,
    })),
    label: labelString !== '' ? null : label,
    type: 'select',
    labelString,
});

export const version = (
    formatMessage,
    versionsList,
    isDisabled = false,
    isMultiSelect = false,
    urlKey = 'version',
    labelString = '',
    label = MESSAGES.version,
) => ({
    isDisabled,
    urlKey,
    isMultiSelect,
    isClearable: true,
    options: versionsList.map(v => ({
        label: `${formatMessage(MESSAGES.version)} ${v.number}`,
        value: v.number,
    })),
    label: labelString !== '' ? null : label,
    type: 'select',
    labelString,
});

export const algo = algoList => ({
    urlKey: 'algorithmId',
    isMultiSelect: false,
    isClearable: true,
    options: algoList.map(a => ({
        label: a.description,
        value: a.id,
    })),
    label: MESSAGES.algo,
    type: 'select',
});

const getRunDisplayName = (runItem, formatMessage) =>
    `${formatMessage(MESSAGES.from)} ${runItem.source.data_source.name} v${
        runItem.source.number
    }` +
    ` ${formatMessage(MESSAGES.to)} ${runItem.destination.data_source.name} v${
        runItem.destination.number
    } (` +
    `${runItem.algorithm_name})`;

export const algoRun = (algoRunList, formatMessage) => ({
    urlKey: 'algorithmRunId',
    isMultiSelect: false,
    isClearable: true,
    options: algoRunList.map(a => ({
        label: getRunDisplayName(a, formatMessage),
        value: a.id,
    })),
    label: MESSAGES.algoRun,
    type: 'select',
});

export const score = () => ({
    urlKey: 'score',
    isMultiSelect: false,
    isClearable: true,
    options: [1, 2, 3, 4, 5].map(s => ({
        label: `${s}`,
        value: `${(s - 1) * 20},${s * 20}`,
    })),
    label: MESSAGES.score,
    renderOption: option => <FullStarsSvg score={parseInt(option.label, 10)} />,
    type: 'select',
    isSearchable: false,
});

export const shape = (formatMessage, urlKey = 'withShape') => ({
    urlKey,
    isMultiSelect: false,
    isClearable: true,
    options: [
        {
            label: formatMessage(MESSAGES.with),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.without),
            value: 'false',
        },
    ],
    label: MESSAGES.shape,
    type: 'select',
});

export const geography = (formatMessage, urlKey = 'geography') => ({
    urlKey,
    isMultiSelect: false,
    isClearable: true,
    options: [
        {
            label: formatMessage(MESSAGES.anyGeography),
            value: 'any',
        },
        {
            label: formatMessage(MESSAGES.withLocation),
            value: 'location',
        },
        {
            label: formatMessage(MESSAGES.withShape),
            value: 'shape',
        },
        {
            label: formatMessage(MESSAGES.noGeographicalData),
            value: 'none',
        },
    ],
    label: MESSAGES.geographicalData,
    type: 'select',
});

export const location = (formatMessage, urlKey = 'withLocation') => ({
    urlKey,
    isMultiSelect: false,
    isClearable: true,
    options: [
        {
            label: formatMessage(MESSAGES.with),
            value: 'true',
        },
        {
            label: formatMessage(MESSAGES.without),
            value: 'false',
        },
    ],
    label: MESSAGES.location,
    type: 'select',
});

export const group = (groupList, urlKey = 'group') => ({
    urlKey,
    isMultiSelect: true,
    isClearable: true,
    options: groupList
        .map(a => ({
            label: a.source_version
                ? `${a.name} - ${a.source_version.data_source.name} ${a.source_version.number}`
                : a.name,
            value: a.id,
        }))
        .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, {
                sensitivity: 'accent',
            }),
        ),
    label: MESSAGES.group,
    type: 'select',
});

const periods = (periodsList, formatPeriods) => ({
    urlKey: 'periods',
    isMultiSelect: true,
    isClearable: true,
    options: periodsList.map(p => ({
        label: formatPeriods(p),
        value: p,
    })),
    label: MESSAGES.periods,
    type: 'select',
});

export const useFormatPeriodFilter = () => {
    const formatPeriod = usePrettyPeriod();
    return periodList => periods(periodList, formatPeriod);
};

export const instanceStatus = options => ({
    urlKey: 'status',
    isMultiSelect: true,
    isClearable: true,
    options,
    label: MESSAGES.status,
    type: 'select',
});

export const showOnlyDeleted = () => ({
    urlKey: 'showDeleted',
    label: MESSAGES.showDeleted,
    type: 'checkbox',
});

export const directChildren = () => ({
    urlKey: 'onlyDirectChildren',
    label: MESSAGES.onlyDirectChildren,
    type: 'checkbox',
    checkedIfNull: true,
});

export const orgUnitFilters = (
    formatMessage = () => null,
    groups = [],
    orgUnitTypes = [],
    withChildren = false,
    validationStatusOptions = [],
    isLoadingValidationStatusOptions = false,
) => {
    const filters = [
        {
            ...search(),
            column: 1,
        },
        {
            ...orgUnitType({
                orgUnitTypes,
                labelString: formatMessage(MESSAGES.orgUnitsTypes),
            }),
            column: 1,
        },
        {
            ...group(groups),
            column: 3,
        },
        {
            ...location(formatMessage),
            column: 2,
        },
        {
            ...shape(formatMessage),
            column: 2,
        },
        {
            ...hasInstances(formatMessage),
            column: 3,
        },
        {
            ...status(
                validationStatusOptions,
                isLoadingValidationStatusOptions,
            ),
            defaultValue: 'all',
            column: 3,
        },
    ];
    if (withChildren) {
        filters.push({
            ...directChildren(),
            column: 1,
        });
    }
    return filters;
};

export const filtersWithPrefix = (filters, paramsPrefix) =>
    filters.map(f => ({
        ...f,
        urlKey: `${paramsPrefix}${capitalize(f.urlKey, true)}`,
        apiUrlKey: f.urlKey,
    }));

export const orgUnitFiltersWithPrefix = (
    paramsPrefix,
    withChildren,
    formatMessage,
    groups,
    orgUnitTypes,
    validationStatusOptions,
    isLoadingValidationStatusOptions,
) =>
    filtersWithPrefix(
        orgUnitFilters(
            formatMessage,
            groups,
            orgUnitTypes,
            withChildren,
            validationStatusOptions,
            isLoadingValidationStatusOptions,
        ),
        paramsPrefix,
    );
export const linksFiltersWithPrefix = (
    paramsPrefix,
    algorithmRuns = [],
    formatMessage = () => null,
    profiles = [],
    algorithms = [],
    sources = [],
) =>
    filtersWithPrefix(
        [
            {
                ...search(),
                column: 1,
            },
            {
                ...algoRun(algorithmRuns, formatMessage),
                column: 1,
            },
            {
                ...linkStatus(formatMessage),
                column: 3,
            },
            {
                ...validator(profiles),
                column: 2,
            },
            {
                ...algo(algorithms),
                column: 2,
            },
            {
                ...score(formatMessage),
                column: 1,
            },
            {
                ...source(
                    sources || [],
                    false,
                    false,
                    'origin',
                    formatMessage(MESSAGES.sourceorigin),
                ),
                column: 3,
            },
        ],
        paramsPrefix,
    );

export const onlyChildrenParams = (paramsPrefix, params, parentId) => {
    const onlyDirectChildren =
        params[getParamsKey(paramsPrefix, 'onlyDirectChildren')];
    return onlyDirectChildren === 'true' || onlyDirectChildren === undefined
        ? { parent_id: parentId }
        : { orgUnitParentId: parentId };
};

export const runsFilters = props => {
    const {
        formatMessage = () => null,
        algorithms = [],
        profiles = [],
        sources = [],
        currentOrigin = null,
        currentDestination = null,
        fetchingProfiles,
        fetchingAlgorithms,
        fetchingSources,
    } = props;
    const filters = [
        {
            ...algo(algorithms),
            loading: fetchingAlgorithms,
            column: 1,
        },
        {
            ...profile(
                profiles,
                false,
                'launcher',
                formatMessage(MESSAGES.launcher),
            ),
            loading: fetchingProfiles,
            column: 1,
        },
        {
            ...source(
                sources || [],
                false,
                false,
                'origin',
                formatMessage(MESSAGES.sourceorigin),
            ),
            loading: fetchingSources,
            column: 2,
        },
        {
            ...version(
                formatMessage,
                currentOrigin ? currentOrigin.versions : [],
                Boolean(
                    !currentOrigin ||
                        (currentOrigin && currentOrigin.versions.length === 0),
                ),
                false,
                'originVersion',
                formatMessage(MESSAGES.sourceoriginversion),
            ),
            column: 2,
        },
        {
            ...source(
                sources || [],
                false,
                false,
                'destination',
                formatMessage(MESSAGES.sourcedestination),
            ),
            column: 3,
        },
        {
            ...version(
                formatMessage,
                currentDestination ? currentDestination.versions : [],
                Boolean(
                    !currentDestination ||
                        (currentDestination &&
                            currentDestination.versions.length === 0),
                ),
                false,
                'destinationVersion',
                formatMessage(MESSAGES.sourcedestinationversion),
            ),
            column: 3,
        },
    ];
    return filters;
};

export const linksFilters = props => {
    const {
        formatMessage = () => null,
        algorithmRuns = [],
        orgUnitTypes = [],
        profiles = [],
        algorithms = [],
        sources = [],
        currentOrigin = null,
        currentDestination = null,
        fetchingRuns,
        fetchingOrgUnitTypes,
        fetchingProfiles,
        fetchingAlgorithms,
        fetchingSources,
    } = props;
    const filters = [
        {
            ...search(),
            column: 1,
        },
        {
            ...algoRun(algorithmRuns, formatMessage),
            loading: fetchingRuns,
            column: 1,
        },
        {
            ...orgUnitType({
                orgUnitTypes,
                labelString: formatMessage(MESSAGES.org_unit_type_id),
            }),
            loading: fetchingOrgUnitTypes,
            column: 1,
        },
        {
            ...linkStatus(formatMessage),
            column: 1,
        },
        {
            ...validator(profiles),
            loading: fetchingProfiles,
            column: 2,
        },
        {
            ...algo(algorithms),
            loading: fetchingAlgorithms,
            column: 2,
        },
        {
            ...score(),
            column: 2,
        },
        {
            ...source(
                sources || [],
                false,
                false,
                'origin',
                formatMessage(MESSAGES.sourceorigin),
            ),
            loading: fetchingSources,
            column: 3,
        },
        {
            ...version(
                formatMessage,
                currentOrigin ? currentOrigin.versions : [],
                Boolean(
                    !currentOrigin ||
                        (currentOrigin && currentOrigin.versions.length === 0),
                ),
                false,
                'originVersion',
                formatMessage(MESSAGES.sourceoriginversion),
            ),
            column: 3,
        },
        {
            ...source(
                sources || [],
                false,
                false,
                'destination',
                formatMessage(MESSAGES.sourcedestination),
            ),
            column: 4,
        },
        {
            ...version(
                formatMessage,
                currentDestination ? currentDestination.versions : [],
                Boolean(
                    !currentDestination ||
                        (currentDestination &&
                            currentDestination.versions.length === 0),
                ),
                false,
                'destinationVersion',
                formatMessage(MESSAGES.sourcedestinationversion),
            ),
            column: 4,
        },
    ];
    return filters;
};

export const formsFilters = () => {
    const filters = [
        {
            ...search(),
            column: 1,
        },
        {
            ...showOnlyDeleted(),
            column: 1,
        },
    ];
    return filters;
};
