const colsCount = 16;
const baseUrl = 'polio/calendar';
const dateFormat = 'YYYY-MM-DD';
const colSpanTitle = 21;
const staticFields = [
    {
        key: 'country',
    },
    {
        key: 'name',
    },
    {
        key: 'r1StartDate',
        render: campaign =>
            campaign.R1Start ? campaign.R1Start.format('L') : '',
    },
];

export { colsCount, baseUrl, dateFormat, colSpanTitle, staticFields };
