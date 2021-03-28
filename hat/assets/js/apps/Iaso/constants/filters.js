import React from 'react';
import Icon from '@material-ui/core/Icon';
import Tooltip from '@material-ui/core/Tooltip';
import MESSAGES from '../domains/forms/messages';
import FullStarsSvg from '../components/stars/FullStarsSvgComponent';
import getDisplayName from '../utils/usersUtils';
import { getParamsKey } from '../utils/tableUtils';
import { Period } from '../domains/periods/models';
import { getOrgunitMessage } from '../domains/orgUnits/utils';
import { capitalize } from '../utils/index';

export const search = (urlKey = 'search') => ({
    urlKey,
    label: MESSAGES.textSearch,
    type: 'search',
});

export const status = (formatMessage, urlKey = 'validation_status') => ({
    urlKey,
    isMultiSelect: false,
    isClearable: false,
    options: [
        {
            label: formatMessage(MESSAGES.all),
            value: 'all',
            icon: (
                <Tooltip title={formatMessage(MESSAGES.all)}>
                    <Icon
                        style={{ color: '#90caf9' }}
                        className="fa fa-circle-o fa-lg"
                    />
                </Tooltip>
            ),
        },
        {
            label: formatMessage(MESSAGES.new),
            value: 'NEW',
            icon: (
                <Tooltip title={formatMessage(MESSAGES.new)}>
                    <Icon
                        style={{ color: '#ffb74d' }}
                        className="fa fa-asterisk fa-lg"
                    />
                </Tooltip>
            ),
        },
        {
            label: formatMessage(MESSAGES.validated),
            value: 'VALID',
            icon: (
                <Tooltip title={formatMessage(MESSAGES.validated)}>
                    <Icon
                        style={{ color: '#4caf50' }}
                        className="fa fa-check fa-lg"
                    />
                </Tooltip>
            ),
        },
        {
            label: formatMessage(MESSAGES.rejected),
            value: 'REJECTED',
            icon: (
                <Tooltip title={formatMessage(MESSAGES.rejected)}>
                    <Icon
                        style={{ color: '#d32f2f' }}
                        className="fa fa-ban fa-lg"
                    />
                </Tooltip>
            ),
        },
    ],
    label: MESSAGES.status,
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
        label: getOrgunitMessage(o, true),
        value: o.id,
    })),
    labelString: `${formatMessage(MESSAGES.level)} ${level + 1}`,
    type: 'select',
    callback,
    value,
});

export const orgUnitType = (
    orgunitTypesList,
    urlKey = 'orgUnitTypeId',
    labelString = '',
    label = MESSAGES.org_unit_type_id,
) => ({
    urlKey,
    isMultiSelect: true,
    isClearable: true,
    options: orgunitTypesList.map(t => ({
        label: t.name,
        value: t.id,
    })),
    label: labelString !== '' ? null : label,
    type: 'select',
    labelString,
});

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
    options: sourceList.map(s => ({
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
        label: <FullStarsSvg score={s} />,
        value: `${(s - 1) * 20},${s * 20}`,
    })),
    label: MESSAGES.score,
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

export const locationsLimit = () => ({
    urlKey: 'locationLimit',
    label: MESSAGES.locationLimit,
    type: 'number',
});

export const group = (groupList, urlKey = 'group') => ({
    urlKey,
    isMultiSelect: true,
    isClearable: true,
    options: groupList.map(a => ({
        label: a.source_version
            ? `${a.name} - ${a.source_version.data_source.name}`
            : a.name,
        value: a.id,
    })),
    label: MESSAGES.group,
    type: 'select',
});

export const periods = periodsList => ({
    urlKey: 'periods',
    isMultiSelect: true,
    isClearable: true,
    options: periodsList.map(p => ({
        label: Period.getPrettyPeriod(p),
        value: p,
    })),
    label: MESSAGES.periods,
    type: 'select',
});

export const instanceStatus = options => ({
    urlKey: 'status',
    isMultiSelect: true,
    isClearable: true,
    options,
    label: MESSAGES.status,
    type: 'select',
});

export const instanceDeleted = () => ({
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
) => {
    const filters = [
        {
            ...search(),
            column: 1,
        },
        {
            ...orgUnitType(orgUnitTypes),
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
            ...status(formatMessage),
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
) =>
    filtersWithPrefix(
        orgUnitFilters(formatMessage, groups, orgUnitTypes, withChildren),
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
                ...status(formatMessage),
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

export const onlyChildrenParams = (paramsPrefix, params, parent) => {
    if (!parent) return null;
    const onlyDirectChildren =
        params[getParamsKey(paramsPrefix, 'onlyDirectChildren')];
    return onlyDirectChildren === 'true' || onlyDirectChildren === undefined
        ? { parent_id: parent.id }
        : { orgUnitParentId: parent.id };
};

export const runsFilters = (
    formatMessage = () => null,
    algorithms = [],
    profiles = [],
    sources = [],
    currentOrigin = null,
    currentDestination = null,
) => {
    const filters = [
        {
            ...algo(algorithms),
            column: 1,
        },
        {
            ...profile(
                profiles,
                false,
                'launcher',
                formatMessage(MESSAGES.launcher),
            ),
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

export const linksFilters = (
    formatMessage = () => null,
    algorithmRuns = [],
    orgUnitTypes = [],
    profiles = [],
    algorithms = [],
    sources = [],
    currentOrigin = null,
    currentDestination = null,
) => {
    const filters = [
        {
            ...search(),
            column: 1,
        },
        {
            ...algoRun(algorithmRuns, formatMessage),
            column: 1,
        },
        {
            ...orgUnitType(orgUnitTypes),
            column: 1,
        },
        {
            ...status(formatMessage),
            column: 1,
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

export const formsFilters = () => {
    const filters = [
        {
            ...search(),
            column: 1,
        },
    ];
    return filters;
};
