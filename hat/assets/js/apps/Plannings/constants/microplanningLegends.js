const villageSelectionLegend = [
    {
        key: 'highlight',
        defaultMessage: 'Endemic villages',
        messageKey: 'microplanning.legend.highlight',
    },
    {
        key: 'YES',
        defaultMessage: 'Officla villages',
        messageKey: 'microplanning.legend.official',
    },
    {
        key: 'selected',
        defaultMessage: 'Selected villages',
        messageKey: 'microplanning.legend.selected',
    },
    {
        key: 'OTHER',
        defaultMessage: 'Selected villages for another team than current one',
        messageKey: 'microplanning.legend.selectedByOther',
    },
];

const geoScopeLegend = [
    {
        key: 'insideGeoloc',
        defaultMessage: 'Villages in one area of current team',
        messageKey: 'microplanning.legend.insideGeoloc',
    },
    {
        key: 'outsideGeoloc',
        defaultMessage: 'Villages not in one area of current team',
        messageKey: 'microplanning.legend.outsideGeoloc',
    },
];

export {
    villageSelectionLegend,
    geoScopeLegend,
};
