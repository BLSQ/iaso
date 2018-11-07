const villageSelectionLegend = [
    {
        key: 'highlight',
        defaultMessage: 'Villages endémiques',
        messageKey: 'microplanning.legend.highlight',
    },
    {
        key: 'YES',
        defaultMessage: 'Villages NON endémiques',
        messageKey: 'microplanning.legend.official',
    },
    {
        key: 'OTHER',
        defaultMessage: 'Villages sélectionnés pour une autre équipe que l’équipe courante',
        messageKey: 'microplanning.legend.selectedByOther',
    },
];

const geoScopeLegend = [
    {
        key: 'selected',
        defaultMessage: 'Villages sélectionnés',
        messageKey: 'microplanning.legend.selected',
    },
    {
        key: 'insideGeoloc',
        defaultMessage: 'Villages dans une AS couverte par l’équipe courante',
        messageKey: 'microplanning.legend.insideGeoloc',
    },
    {
        key: 'outsideGeoloc',
        defaultMessage: 'Villages dans une AS NON couverte par l’équipe courante',
        messageKey: 'microplanning.legend.outsideGeoloc',
    },
];

export {
    villageSelectionLegend,
    geoScopeLegend,
};
