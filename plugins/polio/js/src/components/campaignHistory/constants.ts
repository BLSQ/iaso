import moment from 'moment';
import MESSAGES from '../../constants/messages';

export const LogStructure = [
    {
        key: 'id',
    },
    {
        key: 'obr_name',
    },
    {
        key: 'created_at',
        getLogValue: log => moment(log.created_at).format('LTS'),
    },
    {
        key: 'rounds',
        type: 'array',
        childrenLabel: MESSAGES.round,
        children: [
            {
                key: 'id',
            },
            {
                key: 'started_at',
                getLogValue: log => moment(log.created_at).format('LTS'),
            },
        ],
    },
];
