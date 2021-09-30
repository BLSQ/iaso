import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    polio: {
        defaultMessage: 'Polio',
        id: 'iaso.label.polio',
    },
    campaigns: {
        defaultMessage: 'Campaigns',
        id: 'iaso.polio.label.campaigns',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    removeDistrict: {
        defaultMessage: 'Unselect district',
        id: 'iaso.polio.button.label.removeDistrict',
    },
    removeRegion: {
        defaultMessage: 'Unselect region',
        id: 'iaso.polio.button.label.removeRegion',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    cancel: {
        defaultMessage: 'Cancel',
        id: 'iaso.label.cancel',
    },
    configuration: {
        defaultMessage: 'Configuration',
        id: 'iaso.polio.label.configuration',
    },
    configEmailNotif: {
        defaultMessage: 'Configure country: {country}',
        id: 'iaso.polio.label.configEmailNotif',
    },
    selectUsers: {
        id: 'iaso.polio.select.label.selectUsers',
        defaultMessage: 'Select users',
    },
    selectLanguage: {
        id: 'iaso.polio.select.label.selectLanguage',
        defaultMessage: 'Select language',
    },
    country: {
        id: 'iaso.polio.table.label.country',
        defaultMessage: 'Country',
    },
    usersToNotify: {
        id: 'iaso.polio.table.label.usersToNotify',
        defaultMessage: 'Users to notify',
    },
    language: {
        id: 'iaso.polio.table.label.language',
        defaultMessage: 'Language',
    },
    actions: {
        id: 'iaso.polio.table.label.actions',
        defaultMessage: 'Actions',
    },
    calendar: {
        id: 'iaso.polio.calendar',
        defaultMessage: 'Calendar',
    },
    weeks: {
        id: 'iaso.polio.calendar.weeks',
        defaultMessage: 'week(s) were',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    name: {
        id: 'iaso.polio.label.obrName',
        defaultMessage: 'Name',
    },
    r1StartDate: {
        id: 'iaso.polio.calendar.r1StartDate',
        defaultMessage: 'R1 date',
    },
    raStatus: {
        id: 'iaso.polio.raStatus',
        defaultMessage: 'R1 date',
    },
    budgetStatus: {
        id: 'iaso.polio.budgetStatus',
        defaultMessage: 'Budget status',
    },
    vaccine: {
        id: 'iaso.polio.vaccine',
        defaultMessage: 'Vaccine',
    },
    endDateBeforeStartDate: {
        id: 'iaso.polio.form.validator.error.endDateBeforeStartDate',
        defaultMessage: "End date can't be before start date",
    },
    positiveInteger: {
        id: 'iaso.polio.form.validator.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    // Start
    epid: {
        id: 'iaso.polio.form.label.epid',
        defaultMessage: 'EPID',
    },
    obrName: {
        id: 'iaso.polio.form.label.obrName',
        defaultMessage: 'OBR Name',
    },
    virus: {
        id: 'iaso.polio.form.label.virus',
        defaultMessage: 'Virus',
    },
    vaccines: {
        id: 'iaso.polio.form.label.vaccine',
        defaultMessage: 'Vaccines',
    },
    description: {
        id: 'iaso.polio.form.label.description',
        defaultMessage: 'Description',
    },
    gpeiCoordinator: {
        id: 'iaso.polio.form.label.gpeiCoordinator',
        defaultMessage: 'GPEI Coordinator',
    },
    selectInitialRegion: {
        id: 'iaso.polio.form.label.selectInitialRegion',
        defaultMessage: 'Select initial region',
    },
    dateOfOnset: {
        id: 'iaso.polio.form.label.dateOfOnset',
        defaultMessage: 'Date of onset',
    },
    cvdpv2NotificationDate: {
        id: 'iaso.polio.form.label.cvdpv2NotificationDate',
        defaultMessage: 'cVDPV2 notification date',
    },
    pv2NotificationDate: {
        id: 'iaso.polio.form.label.pv2NotificationDate',
        defaultMessage: 'PV2 notification date',
    },
    threelevelCall: {
        id: 'iaso.polio.form.label.threelevelCall',
        defaultMessage: '3 level call',
    },
    baseInfoFormTitle: {
        id: 'iaso.polio.form.title.baseInfoFormTitle',
        defaultMessage: 'Enter information about the new outbreak response',
    },
    verificationScore: {
        id: 'iaso.polio.form.label.verificationScore',
        defaultMessage: 'Verification Score (/20)',
    },
    fieldInvestigationDate: {
        id: 'iaso.polio.form.label.fieldInvestigationDate',
        defaultMessage: 'Field Investigation Date',
    },
    firstDraftSubmission: {
        id: 'iaso.polio.form.label.firstDraftSubmission',
        defaultMessage: '1st Draft Submission',
    },
    rrtOprttApproval: {
        id: 'iaso.polio.form.label.rrtOprttApproval',
        defaultMessage: 'RRT/OPRTT Approval',
    },
    agNopvGroup: {
        id: 'iaso.polio.form.label.agNopvGroup',
        defaultMessage: 'AG/nOPV Group',
    },
    dgAuthorization: {
        id: 'iaso.polio.form.label.dgAuthorization',
        defaultMessage: 'DG Authorization',
    },
    targetpopulationRoundOne: {
        id: 'iaso.polio.form.label.targetpopulationRoundOne',
        defaultMessage: 'Target population Round 1',
    },
    targetpopulationRoundTwo: {
        id: 'iaso.polio.form.label.targetpopulationRoundTwo',
        defaultMessage: 'Target population Round 2',
    },
    dosesRequested: {
        id: 'iaso.polio.form.label.dosesRequested',
        defaultMessage: 'Doses Requested (both rounds)',
    },
    region: {
        id: 'iaso.polio.table.label.region',
        defaultMessage: 'Region',
    },
    district: {
        id: 'iaso.polio.table.label.district',
        defaultMessage: 'District',
    },
    selectRegion: {
        id: 'iaso.polio.table.label.selectRegion',
        defaultMessage: 'Select region',
    },
    refreshing: {
        id: 'iaso.polio.table.label.refreshing',
        defaultMessage: 'Refreshing...',
    },
    pleaseSaveCampaign: {
        id: 'iaso.polio.form.label.pleaseSaveCampaign',
        defaultMessage: 'Please save the Campaign before selecting scope.',
    },
    disbursedToCoWho: {
        id: 'iaso.polio.form.label.disbursedToCoWho',
        defaultMessage: 'Disbursed to CO (WHO)',
    },
    disbursedToMohWho: {
        id: 'iaso.polio.form.label.disbursedToMohWho',
        defaultMessage: 'Disbursed to MOH (WHO)',
    },
    disbursedToCoUnicef: {
        id: 'iaso.polio.form.label.disbursedToCoUnicef',
        defaultMessage: 'Disbursed to CO (Unicef)',
    },
    disbursedToMohUnicef: {
        id: 'iaso.polio.form.label.disbursedToMohUnicef',
        defaultMessage: 'Disbursed to MOH (Unicef)',
    },
    eomgGroup: {
        id: 'iaso.polio.form.label.eomgGroup',
        defaultMessage: 'EOMG Group',
    },
    budgetSubmittedAt: {
        id: 'iaso.polio.form.label.budgetSubmittedAt',
        defaultMessage: 'Budget Submitted At',
    },
    districtCount: {
        id: 'iaso.polio.form.label.districtCount',
        defaultMessage: 'District Count',
    },
    noRegretFund: {
        id: 'iaso.polio.form.label.noRegretFund',
        defaultMessage: 'No Regret Fund',
    },
    costRoundOne: {
        id: 'iaso.polio.form.label.costRoundOne',
        defaultMessage: 'Cost Round 1',
    },
    costRoundTwo: {
        id: 'iaso.polio.form.label.costRoundTwo',
        defaultMessage: 'Cost Round 1',
    },
    costPerChildRoundOne: {
        id: 'iaso.polio.form.label.costPerChildRoundOne',
        defaultMessage: 'Cost/Child Round 1: $',
    },
    costPerChildRoundTwo: {
        id: 'iaso.polio.form.label.costPerChildRoundTwo',
        defaultMessage: 'Cost/Child Round 2: $',
    },
    costPerChildTotal: {
        id: 'iaso.polio.form.label.costPerChildTotal',
        defaultMessage: 'Cost/Child Total: $',
    },
    roundOneStart: {
        id: 'iaso.polio.form.label.roundOneStart',
        defaultMessage: 'Round 1 Start',
    },
    roundOneEnd: {
        id: 'iaso.polio.form.label.roundOneEnd',
        defaultMessage: 'Round 1 End',
    },
    roundTwoStart: {
        id: 'iaso.polio.form.label.roundtwoStart',
        defaultMessage: 'Round 2 Start',
    },
    roundTwoEnd: {
        id: 'iaso.polio.form.label.roundtwoEnd',
        defaultMessage: 'Round 2 End',
    },
    mopUpStart: {
        id: 'iaso.polio.form.label.mopUpStart',
        defaultMessage: 'Mop Up Start',
    },
    mopUpEnd: {
        id: 'iaso.polio.form.label.mopUpEnd',
        defaultMessage: 'Mop Up End',
    },
    imStart: {
        id: 'iaso.polio.form.label.imStart',
        defaultMessage: 'IM Start',
    },
    imEnd: {
        id: 'iaso.polio.form.label.imEnd',
        defaultMessage: 'IM End',
    },
    lqasStart: {
        id: 'iaso.polio.form.label.lqasStart',
        defaultMessage: 'LQAS Start',
    },
    lqasEnd: {
        id: 'iaso.polio.form.label.lqasEnd',
        defaultMessage: 'LQAS End',
    },
    districtsPassingLqas: {
        id: 'iaso.polio.form.label.districtsPassingLqas',
        defaultMessage: 'Districts passing LQAS',
    },
    districtsFailingLqas: {
        id: 'iaso.polio.form.label.districtsFailingLqas',
        defaultMessage: 'Districts failing LQAS',
    },
    mainReasonForNonVaccination: {
        id: 'iaso.polio.form.label.mainReasonForNonVaccination',
        defaultMessage: 'Main reason for non-vaccination',
    },
    ratioChildrenMissedInHousehold: {
        id: 'iaso.polio.form.label.ratioChildrenMissedInHousehold',
        defaultMessage: '% children missed IN household',
    },
    ratioChildrenMissedOutOfHousehold: {
        id: 'iaso.polio.form.label.ratioChildrenMissedOutOfHousehold',
        defaultMessage: '% children missed OUT OF household',
    },
    ratioChildrenMissedInAndOutOfHousehold: {
        id: 'iaso.polio.form.label.ratioChildrenMissedInAndOutOfHousehold',
        defaultMessage: '% children missed IN+OUT OF household',
    },
    awarenessCampaignPlanning: {
        id: 'iaso.polio.form.label.awarenessCampaignPlanning',
        defaultMessage: 'Awareness of campaign planning (%)',
    },
    createCampaign: {
        id: 'iaso.polio.createCampaign',
        defaultMessage: 'Create campaign',
    },
    editCampaign: {
        id: 'iaso.polio.editCampaign',
        defaultMessage: 'Edit campaign',
    },
    baseInfo: {
        id: 'iaso.polio.title.baseInfo',
        defaultMessage: 'Base info',
    },
    detection: {
        id: 'iaso.polio.title.detection',
        defaultMessage: 'Detection',
    },
    riskAssessment: {
        id: 'iaso.polio.title.riskAssessment',
        defaultMessage: 'Risk Assessment',
    },
    scope: {
        id: 'iaso.polio.title.scope',
        defaultMessage: 'Scope',
    },
    budget: {
        id: 'iaso.polio.title.budget',
        defaultMessage: 'Budget',
    },
    preparedness: {
        id: 'iaso.polio.title.preparedness',
        defaultMessage: 'Preparedness',
    },
    roundOne: {
        id: 'iaso.polio.title.roundOne',
        defaultMessage: 'Round 1',
    },
    roundTwo: {
        id: 'iaso.polio.title.roundTwo',
        defaultMessage: 'Round 2',
    },
    deleteWarning: {
        id: 'iaso.polio.label.deleteWarning',
        defaultMessage: 'Are you sure you want to delete this campaign?',
    },
    operationCantBeUndone: {
        id: 'iaso.polio.label.operationCantBeUndone',
        defaultMessage: 'This operation cannot be undone',
    },
    no: {
        id: 'iaso.polio.label.no',
        defaultMessage: 'No',
    },
    yes: {
        id: 'iaso.polio.label.yes',
        defaultMessage: 'Yes',
    },
    status: {
        id: 'iaso.polio.table.label.status',
        defaultMessage: 'Status',
    },
    import: {
        id: 'iaso.polio.button.label.import',
        defaultMessage: 'Import',
    },
    create: {
        id: 'iaso.polio.label.create',
        defaultMessage: 'Create',
    },
    csv: {
        id: 'iaso.polio.label.csv',
        defaultMessage: 'CSV',
    },
});

export default MESSAGES;
