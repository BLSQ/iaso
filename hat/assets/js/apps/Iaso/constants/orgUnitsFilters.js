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
