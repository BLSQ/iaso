import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    entities: {
        id: 'iaso.wfp.beneficiaries.etl',
        defaultMessage: 'ETL beneficiaries',
    },
    entityType: {
        id: 'iaso.entityTypes.label',
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
        defaultMessage: 'Entity id, UUID or progress id',
    },
    entityId: {
        id: 'iaso.wfp.beneficiaries.entityId',
        defaultMessage: 'Entity id',
    },
    progressId: {
        id: 'iaso.wfp.beneficiaries.progressId',
        defaultMessage: 'Progress id',
    },
    uuid: {
        id: 'iaso.label.uuid',
        defaultMessage: 'UUID',
    },
    gender: {
        id: 'iaso.entities.gender',
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
        id: 'iaso.entities.lastVisit',
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
        id: 'iaso.label.date',
        defaultMessage: 'Date',
    },
    orgUnit: {
        id: 'iaso.label.orgUnitSingle',
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
        id: 'iaso.instance.titleSingle',
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
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    loading: {
        id: 'iaso.label.loading',
        defaultMessage: 'Loading',
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
    entityTitle: {
        id: 'iaso.wfp.beneficiaries.entityTitle',
        defaultMessage: 'Entity {id} · {entityType}',
    },
    created: {
        id: 'iaso.wfp.beneficiaries.created',
        defaultMessage: 'Created',
    },
    deleted: {
        id: 'iaso.wfp.beneficiaries.deleted',
        defaultMessage: 'Deleted',
    },
    etlGender: {
        id: 'iaso.wfp.beneficiaries.etlGender',
        defaultMessage: 'ETL gender',
    },
    etlBirthDate: {
        id: 'iaso.wfp.beneficiaries.etlBirthDate',
        defaultMessage: 'ETL birth date',
    },
    etlGuidelines: {
        id: 'iaso.wfp.beneficiaries.etlGuidelines',
        defaultMessage: 'ETL guidelines',
    },
    referenceForm: {
        id: 'iaso.entityTypes.referenceForm',
        defaultMessage: 'Reference form',
    },
    referenceFormSubmission: {
        id: 'iaso.wfp.beneficiaries.referenceFormSubmission',
        defaultMessage: 'Reference form · submission {id}',
    },
    noReferenceData: {
        id: 'iaso.wfp.beneficiaries.noReferenceData',
        defaultMessage: 'No reference form data',
    },
    linkedSubmissions: {
        id: 'iaso.wfp.beneficiaries.linkedSubmissions',
        defaultMessage: 'Submissions linked to the entity ({count})',
    },
    noSubmissions: {
        id: 'iaso.wfp.beneficiaries.noSubmissions',
        defaultMessage: 'No submissions',
    },
    noFields: {
        id: 'iaso.wfp.beneficiaries.noFields',
        defaultMessage: 'No fields',
    },
    deletedTag: {
        id: 'iaso.wfp.beneficiaries.deletedTag',
        defaultMessage: '(deleted)',
    },
    deviceDate: {
        id: 'iaso.wfp.beneficiaries.deviceDate',
        defaultMessage: 'device: {date}',
    },
    syncedDate: {
        id: 'iaso.wfp.beneficiaries.syncedDate',
        defaultMessage: 'synced: {date}',
    },
    updatedDate: {
        id: 'iaso.wfp.beneficiaries.updatedDate',
        defaultMessage: 'updated: {date}',
    },
    openSubmission: {
        id: 'iaso.wfp.beneficiaries.openSubmission',
        defaultMessage: 'Open submission',
    },
});

export default MESSAGES;
