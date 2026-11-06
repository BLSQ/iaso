import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    entities: {
        id: 'iaso.wfp.beneficiaries.etl',
        defaultMessage: 'ETL beneficiaries',
    },
    entityType: {
        id: 'iaso.wfp.beneficiaries.entityType',
        defaultMessage: 'Entity type',
    },
    programme: {
        id: 'iaso.wfp.beneficiaries.programme',
        defaultMessage: 'Programme',
    },
    orgUnitGroup: {
        id: 'iaso.wfp.beneficiaries.orgUnitGroup',
        defaultMessage: 'Org unit group',
    },
    orgUnitGroupTooltip: {
        id: 'iaso.wfp.beneficiaries.orgUnitGroupTooltip',
        defaultMessage:
            'Only the visits made in the org units of this group (e.g. the facilities of a partner)',
    },
    search: {
        id: 'iaso.wfp.beneficiaries.search',
        defaultMessage: 'Entity id or UUID',
    },
    entityId: {
        id: 'iaso.wfp.beneficiaries.entityId',
        defaultMessage: 'Entity id',
    },
    uuid: {
        id: 'iaso.wfp.beneficiaries.uuid',
        defaultMessage: 'UUID',
    },
    gender: {
        id: 'iaso.wfp.beneficiaries.gender',
        defaultMessage: 'Gender',
    },
    birthDate: {
        id: 'iaso.wfp.beneficiaries.birthDate',
        defaultMessage: 'Birth date',
    },
    journeys: {
        id: 'iaso.wfp.beneficiaries.journeys',
        defaultMessage: 'Journeys',
    },
    visits: {
        id: 'iaso.wfp.beneficiaries.visits',
        defaultMessage: 'Visits',
    },
    lastVisit: {
        id: 'iaso.wfp.beneficiaries.lastVisit',
        defaultMessage: 'Last visit',
    },
    seeEntity: {
        id: 'iaso.wfp.beneficiaries.seeEntity',
        defaultMessage: 'Entity in IASO',
    },
    journey: {
        id: 'iaso.wfp.beneficiaries.journey',
        defaultMessage: 'Journey {number}',
    },
    noProgramme: {
        id: 'iaso.wfp.beneficiaries.noProgramme',
        defaultMessage: 'No programme',
    },
    ongoing: {
        id: 'iaso.wfp.beneficiaries.ongoing',
        defaultMessage: 'ongoing',
    },
    exit: {
        id: 'iaso.wfp.beneficiaries.exit',
        defaultMessage: 'exit: {exitType}',
    },
    admission: {
        id: 'iaso.wfp.beneficiaries.admission',
        defaultMessage: 'admission: {admissionType}',
    },
    admissionCriteria: {
        id: 'iaso.wfp.beneficiaries.admissionCriteria',
        defaultMessage: 'admission criteria: {admissionCriteria}',
    },
    noVisits: {
        id: 'iaso.wfp.beneficiaries.noVisits',
        defaultMessage: 'No visits',
    },
    date: {
        id: 'iaso.wfp.beneficiaries.date',
        defaultMessage: 'Date',
    },
    orgUnit: {
        id: 'iaso.wfp.beneficiaries.orgUnit',
        defaultMessage: 'Org unit',
    },
    muac: {
        id: 'iaso.wfp.beneficiaries.muac',
        defaultMessage: 'MUAC',
    },
    whz: {
        id: 'iaso.wfp.beneficiaries.whz',
        defaultMessage: 'WHZ',
    },
    oedema: {
        id: 'iaso.wfp.beneficiaries.oedema',
        defaultMessage: 'Oedema',
    },
    entryPoint: {
        id: 'iaso.wfp.beneficiaries.entryPoint',
        defaultMessage: 'Entry point',
    },
    assistance: {
        id: 'iaso.wfp.beneficiaries.assistance',
        defaultMessage: 'Assistance',
    },
    submission: {
        id: 'iaso.wfp.beneficiaries.submission',
        defaultMessage: 'Submission',
    },
    yes: {
        id: 'iaso.label.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'iaso.label.no',
        defaultMessage: 'No',
    },
    exportCoda: {
        id: 'iaso.wfp.beneficiaries.exportCoda',
        defaultMessage: 'Export CODA 2.0',
    },
    exportCodaTooltip: {
        id: 'iaso.wfp.beneficiaries.exportCodaTooltip',
        defaultMessage:
            'One row per visit of the beneficiaries matching the filters',
    },
    exportRaw: {
        id: 'iaso.wfp.beneficiaries.exportRaw',
        defaultMessage: 'Export raw data',
    },
    exportRawTooltip: {
        id: 'iaso.wfp.beneficiaries.exportRawTooltip',
        defaultMessage:
            'The ETL tables and the submissions (one sheet per form) of the beneficiaries matching the filters',
    },
    beneficiaryData: {
        id: 'iaso.wfp.beneficiaries.beneficiaryData',
        defaultMessage: 'Beneficiary data',
    },
    debug: {
        id: 'iaso.wfp.beneficiaries.debug',
        defaultMessage: 'Debug',
    },
    close: {
        id: 'iaso.wfp.beneficiaries.close',
        defaultMessage: 'Close',
    },
    loading: {
        id: 'iaso.wfp.beneficiaries.loading',
        defaultMessage: 'Loading…',
    },
    couldNotLoadData: {
        id: 'iaso.wfp.beneficiaries.couldNotLoadData',
        defaultMessage: 'Could not load the data',
    },
    couldNotLoadSubmission: {
        id: 'iaso.wfp.beneficiaries.couldNotLoadSubmission',
        defaultMessage: 'Could not load the submission',
    },
    none: {
        id: 'iaso.wfp.beneficiaries.none',
        defaultMessage: 'none',
    },
    noJourneys: {
        id: 'iaso.wfp.beneficiaries.noJourneys',
        defaultMessage: 'No journeys',
    },
    actions: {
        id: 'iaso.label.actions',
        defaultMessage: 'Action(s)',
    },
    noBeneficiaries: {
        id: 'iaso.wfp.beneficiaries.noBeneficiaries',
        defaultMessage: 'No beneficiaries found',
    },
});

export default MESSAGES;
