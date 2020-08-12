import React from 'react';

import MESSAGES from '../domains/forms/messages';
import FullStarsSvg from '../components/stars/FullStarsSvgComponent';
import getDisplayName from '../utils/usersUtils';
import { Period } from '../domains/periods/models';
import { getOrgunitMessage } from '../domains/orgUnits/utils';


export const search = () => (
    {
        urlKey: 'search',
        label: MESSAGES.textSearch,
        type: 'search',
    }
);

export const status = formatMessage => (
    {
        urlKey: 'validation_status',
        isMultiSelect: false,
        isClearable: false,
        options: [
            {
                label: formatMessage(MESSAGES.all),
                value: 'all',
            },
            {
                label: formatMessage(MESSAGES.new),
                value: 'NEW',
            },
            {
                label: formatMessage(MESSAGES.validated),
                value: 'VALID',
            },
                        {
                label: formatMessage(MESSAGES.rejected),
                value: 'REJECTED',
            },
        ],
        label: MESSAGES.status,
        type: 'select',
    }
);

export const hasInstances = formatMessage => (
    {
        urlKey: 'hasInstances',
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
        label: MESSAGES.hasInstances,
        type: 'select',
    }
);

export const orgUnitLevel = (orgunitList, level, callback, value, formatMessage) => (
    {
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
    }
);

export const orgUnitType = (
    orgunitTypesList,
    urlKey = 'orgUnitTypeId',
    labelString = '',
    label = MESSAGES.org_unit_type_id,
) => (
    {
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
    }
);

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
) => (
    {
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
    }
);

export const subSource = (formatMessage, sourceList) => (
    {
        urlKey: 'sourceId',
        isMultiSelect: false,
        isClearable: true,
        options: sourceList.map(t => ({
            label: formatMessage(MESSAGES[t[0]]),
            value: t[0],
        })),
        label: MESSAGES.subSource,
        type: 'select',
    }
);

export const device = deviceList => (
    {
        urlKey: 'deviceId',
        isMultiSelect: false,
        isClearable: true,
        options: deviceList.map(d => ({
            label: d.imei,
            value: d.id,
        })),
        label: MESSAGES.device,
        type: 'select',
    }
);

export const deviceOwnership = deviceOnershipList => (
    {
        urlKey: 'deviceOwnershipId',
        isMultiSelect: false,
        isClearable: true,
        options: deviceOnershipList.map(o => ({
            label: `${getDisplayName(o.user)} - IMEI:${o.device.imei}`,
            value: o.id,
        })),
        label: MESSAGES.deviceOwnership,
        type: 'select',
    }
);


export const validator = profileList => (
    {
        urlKey: 'validatorId',
        isMultiSelect: false,
        isClearable: true,
        options: profileList.map(u => ({
            label: u.user_name,
            value: u.id,
        })),
        label: MESSAGES.validator,
        type: 'select',
    }
);

export const profile = (
    profileList,
    isMultiSelect = false,
    urlKey = 'profile',
    labelString = '',
    label = MESSAGES.profile,
) => (
    {
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
    }
);

export const version = (
    formatMessage,
    versionsList,
    isDisabled = false,
    isMultiSelect = false,
    urlKey = 'version',
    labelString = '',
    label = MESSAGES.version,
) => (
    {
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
    }
);

export const algo = algoList => (
    {
        urlKey: 'algorithmId',
        isMultiSelect: false,
        isClearable: true,
        options: algoList.map(a => ({
            label: a.description,
            value: a.id,
        })),
        label: MESSAGES.algo,
        type: 'select',
    }
);

const getRunDisplayName = (runItem, formatMessage) => (
    `${formatMessage(MESSAGES.from)} ${runItem.version_2.data_source.name} v${runItem.version_2.number}`
    + ` ${formatMessage(MESSAGES.to)} ${runItem.version_1.data_source.name} v${runItem.version_1.number} (`
    + `${runItem.algorithm_name})`
);

export const algoRun = (algoRunList, formatMessage) => (
    {
        urlKey: 'algorithmRunId',
        isMultiSelect: false,
        isClearable: true,
        options: algoRunList.map(a => ({
            label: getRunDisplayName(a, formatMessage),
            value: a.id,
        })),
        label: MESSAGES.algoRun,
        type: 'select',
    }
);

export const score = () => (
    {
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
    }
);

export const shape = formatMessage => (
    {
        urlKey: 'withShape',
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
    }
);


export const location = formatMessage => (
    {
        urlKey: 'withLocation',
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
    }
);


export const locationsLimit = () => (
    {
        urlKey: 'locationLimit',
        label: MESSAGES.locationLimit,
        type: 'number',
    }
);

export const group = groupList => (
    {
        urlKey: 'group',
        isMultiSelect: true,
        isClearable: true,
        options: groupList.map(a => ({
            label: a.name,
            value: a.id,
        })),
        label: MESSAGES.group,
        type: 'select',
    }
);


export const periods = periodsList => (
    {
        urlKey: 'periods',
        isMultiSelect: true,
        isClearable: true,
        options: periodsList.map(p => ({
            label: Period.getPrettyPeriod(p),
            value: p,
        })),
        label: MESSAGES.periods,
        type: 'select',
    }
);


export const instanceStatus = options => (
    {
        urlKey: 'status',
        isMultiSelect: true,
        isClearable: true,
        options,
        label: MESSAGES.status,
        type: 'select',
    }
);
