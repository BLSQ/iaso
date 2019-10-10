import MESSAGES from '../components/forms/messages';
import getDisplayName from '../utils/usersUtils';

export const search = () => (
    {
        urlKey: 'search',
        label: {
            id: 'iaso.forms.textSearch',
            defaultMessage: 'Text search',
        },
        type: 'search',
    }
);

export const status = formatMessage => (
    {
        urlKey: 'validated',
        isMultiSelect: false,
        isClearable: false,
        options: [
            {
                label: formatMessage(MESSAGES.both),
                value: 'both',
            },
            {
                label: formatMessage(MESSAGES.validated),
                value: 'true',
            },
            {
                label: formatMessage(MESSAGES.notValidated),
                value: 'false',
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
                label: formatMessage(MESSAGES.yes),
                value: 'true',
            },
            {
                label: formatMessage(MESSAGES.no),
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
            label: `${o.name} (${o.org_unit_type_name})`,
            value: o.id,
        })),
        labelString: `${formatMessage(MESSAGES.level)} ${level + 1}`,
        type: 'select',
        callback,
        value,
    }
);
export const orgUnitType = (formatMessage, orgunitTypesList) => (
    {
        urlKey: 'orgUnitTypeId',
        isMultiSelect: false,
        isClearable: true,
        options: orgunitTypesList.map(t => ({
            label: t.name,
            value: t.id,
        })),
        label: MESSAGES.org_unit_type_id,
        type: 'select',
    }
);

export const source = (formatMessage, sourceList) => (
    {
        urlKey: 'source',
        isMultiSelect: false,
        isClearable: true,
        options: sourceList.map(t => ({
            label: t.name,
            value: t.id,
        })),
        label: MESSAGES.source,
        type: 'select',
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
