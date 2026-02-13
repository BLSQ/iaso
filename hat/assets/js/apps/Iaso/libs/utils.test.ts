import { mapOptions } from './utils';

const optionsRequestResponse = {
    name: 'My DB super model',
    description: 'A very great model from the DB',
    renders: ['application/json', 'text/html', 'text/csv'],
    parses: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
    ],
    actions: {
        POST: {
            id: {
                type: 'integer',
                required: false,
                read_only: true,
                label: 'ID',
            },
            user: {
                type: 'nested object',
                required: false,
                read_only: true,
                label: 'User',
                children: {
                    id: {
                        type: 'integer',
                        required: false,
                        read_only: true,
                        label: 'ID',
                    },
                    username: {
                        type: 'string',
                        required: true,
                        read_only: false,
                        label: 'Username',
                        help_text:
                            'Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.',
                        max_length: 150,
                    },
                    first_name: {
                        type: 'string',
                        required: false,
                        read_only: false,
                        label: 'First name',
                        max_length: 150,
                    },
                    last_name: {
                        type: 'string',
                        required: false,
                        read_only: false,
                        label: 'Last name',
                        max_length: 150,
                    },
                },
            },
            status: {
                type: 'choice',
                required: false,
                read_only: false,
                label: 'Status',
                choices: [
                    {
                        value: 'pending',
                        display_name: 'Pending',
                    },
                    {
                        value: 'sent',
                        display_name: 'Sent',
                    },
                    {
                        value: 'rejected',
                        display_name: 'Rejected',
                    },
                    {
                        value: 'paid',
                        display_name: 'Paid',
                    },
                ],
            },
            type: {
                type: 'choice',
                required: false,
                read_only: false,
                label: 'Status',
                choices: [
                    {
                        value: 'good',
                        display_name: 'Good',
                    },
                    {
                        value: 'bad',
                        display_name: 'Bad',
                    },
                    {
                        value: 'very_bad',
                        display_name: 'Very bad',
                    },
                ],
            },
            created_at: {
                type: 'datetime',
                required: false,
                read_only: true,
                label: 'Created at',
            },
            updated_at: {
                type: 'datetime',
                required: false,
                read_only: true,
                label: 'Updated at',
            },
            created_by: {
                type: 'field',
                required: false,
                read_only: true,
                label: 'Created by',
            },
            updated_by: {
                type: 'field',
                required: false,
                read_only: true,
                label: 'Updated by',
            },
        },
    },
};

const control = {
    status: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Paid', value: 'paid' },
    ],
    type: [
        { label: 'Good', value: 'good' },
        { label: 'Bad', value: 'bad' },
        { label: 'Very bad', value: 'very_bad' },
    ],
};

const typeOnly = {
    type: [
        { label: 'Good', value: 'good' },
        { label: 'Bad', value: 'bad' },
        { label: 'Very bad', value: 'very_bad' },
    ],
};

const fields = ['type'];

describe('mapOptions helper method', () => {
    it('converts response to correct format', () => {
        const result = mapOptions(optionsRequestResponse);
        expect(result).deep.equals(control);
    });
    it('selects returned fields if param is passed', () => {
        const result = mapOptions(optionsRequestResponse, fields);
        expect(result).deep.equals(typeOnly);
    });
});
