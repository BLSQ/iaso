
import {
    defineMessages,
} from 'react-intl';

export const MESSAGES = defineMessages({
    province: {
        id: 'microplanning.tooltip.province',
        defaultMessage: 'Province',
    },
    former_province: {
        id: 'microplanning.tooltip.province.former',
        defaultMessage: 'Former province',
    },
    zs: {
        id: 'microplanning.tooltip.zone',
        defaultMessage: 'Zone de sante',
    },
    as: {
        id: 'microplanning.tooltip.area',
        defaultMessage: 'Health area',
    },
    name: {
        id: 'microplanning.tooltip.village',
        defaultMessage: 'Village',
    },
    villagesOfficial: {
        id: 'microplanning.tooltip.villages.official',
        defaultMessage: 'Villages Z.S.',
    },
    villagesOther: {
        id: 'microplanning.tooltip.villages.other',
        defaultMessage: 'Villages non-Z.S.',
    },
    villagesUnknown: {
        id: 'microplanning.tooltip.villages.unknown',
        defaultMessage: 'Villages satellite',
    },
    village_official: {
        id: 'microplanning.tooltip.type',
        defaultMessage: 'Classification',
    },
    latitude: {
        id: 'microplanning.tooltip.latitude',
        defaultMessage: 'Latitude',
    },
    longitude: {
        id: 'microplanning.tooltip.longitude',
        defaultMessage: 'Longitude',
    },
    gps_source: {
        id: 'microplanning.tooltip.gps.source',
        defaultMessage: 'GPS source',
    },

    population: {
        id: 'microplanning.tooltip.population',
        defaultMessage: 'Population',
    },
    population_source: {
        id: 'microplanning.tooltip.population.source',
        defaultMessage: 'Population source',
    },
    population_year: {
        id: 'microplanning.tooltip.population.year',
        defaultMessage: 'Year surveyed population',
    },

    lastConfirmedCaseDate: {
        id: 'microplanning.tooltip.case.date',
        defaultMessage: 'Last confirmed HAT case date',
    },
    lastConfirmedCaseYear: {
        id: 'microplanning.tooltip.case.year',
        defaultMessage: 'Last confirmed HAT case year',
    },
    nr_positive_cases: {
        id: 'microplanning.tooltip.cases',
        defaultMessage: 'Confirmed HAT cases',
    },
    team_all: {
        defaultMessage: 'None',
        id: 'main.label.none',
    },
    team_select: {
        defaultMessage: 'Team',
        id: 'microplanning.label.team',
    },
    add_as: {
        defaultMessage: 'Add arrea to the',
        id: 'microplanning.label.add_as',
    },
    remove_as: {
        defaultMessage: 'Remove area form the team',
        id: 'microplanning.label.remove_as',
    },

    // type values
    YES: {
        id: 'microplanning.tooltip.village.type.official',
        defaultMessage: 'from Z.S.',
    },
    NO: {
        id: 'microplanning.tooltip.village.type.notofficial',
        defaultMessage: 'not from Z.S.',
    },
    OTHER: {
        id: 'microplanning.tooltip.village.type.other',
        defaultMessage: 'found during campaigns',
    },
    NA: {
        id: 'microplanning.tooltip.village.type.unknown',
        defaultMessage: 'visible from satellite',
    },
});

export const ROWS = [
    { key: 'name' },
    { key: 'zs' },
    { key: 'as' },
    { key: 'province' },
    { key: 'former_province' },
    { key: 'villagesOfficial', type: 'integer' },
    { key: 'villagesOther', type: 'integer' },
    { key: 'villagesUnknown', type: 'integer' },
    { key: 'village_official', type: 'message' },
    { key: 'latitude', type: 'coordinates' },
    { key: 'longitude', type: 'coordinates' },
    { key: 'gps_source' },
    { key: 'population', type: 'integer' },
    { key: 'population_year' },
    { key: 'population_source' },
    { key: 'lastConfirmedCaseDate', type: 'date' },
    { key: 'lastConfirmedCaseYear' },
    { key: 'nr_positive_cases', type: 'integer' },
];