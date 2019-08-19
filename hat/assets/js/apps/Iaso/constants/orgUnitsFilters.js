import MESSAGES from '../components/forms/messages';

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

export const orgUnitType = (formatMessage, orgunitTypesList) => (
    {
        urlKey: 'orgUnitTypeId',
        isMultiSelect: false,
        isClearable: true,
        options: orgunitTypesList.map(t => ({
            label: formatMessage(MESSAGES[t.short_name]),
            value: t.id,
        })),
        label: MESSAGES.org_unit_type_id,
        type: 'select',
    }
);

export const source = (formatMessage, sourceList) => (
    {
        urlKey: 'sourceId',
        isMultiSelect: false,
        isClearable: true,
        options: sourceList.map(t => ({
            label: formatMessage(MESSAGES[t[0]]),
            value: t[0],
        })),
        label: MESSAGES.source,
        type: 'select',
    }
);
