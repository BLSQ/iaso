import { apiDateFormat } from 'Iaso/utils/dates';

const colsCount = 16;
const dateFormat = apiDateFormat;
const colSpanTitle = 21;
const defaultOrder = 'round_one__started_at';
const staticFields = [
    {
        key: 'country',
        sortKey: 'country__name',
    },
    {
        key: 'name',
        sortKey: 'obr_name',
    },
    {
        key: 'r1StartDate',
        sortKey: 'round_one__started_at',
        render: campaign =>
            campaign.R1Start ? campaign.R1Start.format('L') : '',
    },
];

export { colsCount, dateFormat, colSpanTitle, staticFields, defaultOrder };
