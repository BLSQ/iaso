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
    campaign: {
        defaultMessage: 'Campaign',
        id: 'iaso.polio.label.campaign',
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
    vaccines: {
        id: 'iaso.polio.vaccines',
        defaultMessage: 'Vaccines',
    },
    endDateBeforeStartDate: {
        id: 'iaso.polio.form.validator.error.endDateBeforeStartDate',
        defaultMessage: "End date can't be before start date",
    },
    positiveInteger: {
        id: 'iaso.polio.form.validator.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    noCampaign: {
        id: 'iaso.polio.noCampaign',
        defaultMessage: 'No campaign to display',
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
    description: {
        id: 'iaso.polio.form.label.description',
        defaultMessage: 'Description',
    },
    gpeiCoordinator: {
        id: 'iaso.polio.form.label.gpeiCoordinator',
        defaultMessage: 'GPEI Coordinator',
    },
    preventive: {
        id: 'iaso.polio.form.label.preventive',
        defaultMessage: 'Preventive campaign',
    },
    preventiveShort: {
        id: 'iaso.polio.form.label.preventive.short',
        defaultMessage: 'Preventive',
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
        id: 'iaso.polio.district',
        defaultMessage: 'District',
    },
    districts: {
        id: 'iaso.polio.districts',
        defaultMessage: 'Districts',
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
        defaultMessage: 'Cost Round 2',
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
    sync_status: {
        id: 'iaso.polio.table.label.status',
        defaultMessage: 'Synchronisation',
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
    enterOrCreateGoogleSheet: {
        id: 'iaso.polio.label.enterOrCreateGoogleSheet',
        defaultMessage:
            'Enter Google Sheet url or use the button to generate a new one',
    },
    enterGoogleSheet: {
        id: 'iaso.polio.label.enterGoogleSheet',
        defaultMessage: 'Enter Google Sheet url',
    },
    preparednessGoogleSheetUrl: {
        id: 'iaso.polio.title.preparednessGoogleSheetUrl',
        defaultMessage: 'Preparedness Google Sheet URL',
    },
    refreshPreparednessData: {
        id: 'iaso.polio.title.refreshPreparednessData',
        defaultMessage: 'Refresh Preparedness data',
    },
    generateSpreadsheet: {
        id: 'iaso.polio.title.generateSpreadsheet',
        defaultMessage: 'Generate a spreadsheet',
    },
    preparednessError: {
        id: 'iaso.polio.label.preparednessError',
        defaultMessage: 'Error Generating preparedness',
    },
    national: {
        id: 'iaso.polio.label.national',
        defaultMessage: 'National',
    },
    regional: {
        id: 'iaso.polio.label.regional',
        defaultMessage: 'Regional',
    },
    districtScore: {
        id: 'iaso.polio.label.districtScore',
        defaultMessage: 'District',
    },
    refreshedAt: {
        id: 'iaso.polio.label.refreshedAt',
        defaultMessage: 'Refreshed at',
    },
    recruitmentSurgeUrl: {
        id: 'iaso.polio.label.recruitmentSurgeUrl',
        defaultMessage: 'Recruitment Surge Google Sheet URL',
    },
    countryNameInSheet: {
        id: 'iaso.polio.label.countryNameInSheet',
        defaultMessage: 'Country Name in sheet',
    },
    whoToRecruit: {
        id: 'iaso.polio.label.whoToRecruit',
        defaultMessage: 'WHO To Recruit',
    },
    whoCompletedRecruitement: {
        id: 'iaso.polio.label.whoCompletedRecruitement',
        defaultMessage: 'WHO Completed Recruitment',
    },
    unicefToRecruit: {
        id: 'iaso.polio.label.unicefToRecruit',
        defaultMessage: 'UNICEF To Recruit',
    },
    unicefCompletedRecruitement: {
        id: 'iaso.polio.label.unicefCompletedRecruitement',
        defaultMessage: 'UNICEF Completed Recruitment',
    },
    refreshRecruitmentData: {
        id: 'iaso.polio.label.refreshRecruitmentData',
        defaultMessage: 'Refresh Recruitment Data',
    },
    paymentMode: {
        id: 'iaso.polio.label.paymentMode',
        defaultMessage: 'Payment Mode',
    },
    responsible: {
        id: 'iaso.polio.label.responsible',
        defaultMessage: 'Responsible',
    },
    pending: {
        id: 'iaso.polio.label.pending',
        defaultMessage: 'Pending',
    },
    ongoing: {
        id: 'iaso.polio.label.ongoing',
        defaultMessage: 'Ongoing',
    },
    finished: {
        id: 'iaso.polio.label.finished',
        defaultMessage: 'Finished',
    },
    reviewedByRrt: {
        id: 'iaso.polio.label.reviewedByRrt',
        defaultMessage: 'Reviewed by RRT',
    },
    submitted: {
        id: 'iaso.polio.label.submitted',
        defaultMessage: 'Submitted',
    },
    toSubmit: {
        id: 'iaso.polio.label.toSubmit',
        defaultMessage: 'To submit',
    },
    approved: {
        id: 'iaso.polio.label.approved',
        defaultMessage: 'Approved',
    },
    who: {
        id: 'iaso.polio.label.who',
        defaultMessage: 'WHO',
    },
    unicef: {
        id: 'iaso.polio.label.unicef',
        defaultMessage: 'UNICEF',
    },
    moh: {
        id: 'iaso.polio.label.moh',
        defaultMessage: 'MOH',
    },
    provinceOption: {
        id: 'iaso.polio.label.provinceOption',
        defaultMessage: 'PROVINCE',
    },
    PREPARING: {
        id: 'iaso.polio.PREPARING',
        defaultMessage: 'Preparing',
    },
    ROUND1START: {
        id: 'iaso.polio.ROUND1START',
        defaultMessage: 'Round 1 started',
    },
    ROUND1DONE: {
        id: 'iaso.polio.ROUND1DONE',
        defaultMessage: 'Round 1 completed',
    },
    ROUND2START: {
        id: 'iaso.polio.ROUND2START',
        defaultMessage: 'Round 2 started',
    },
    ROUND2DONE: {
        id: 'iaso.polio.ROUND2DONE',
        defaultMessage: 'Round 2 completed',
    },
    filter: {
        id: 'iaso.polio.label.filter',
        defaultMessage: 'Filter',
    },
    R1StartFrom: {
        id: 'iaso.polio.label.R1StartFrom',
        defaultMessage: 'R1 start date from',
    },
    R1StartTo: {
        id: 'iaso.polio.label.R1StartTo',
        defaultMessage: 'R1 start date to',
    },
    sortAsc: {
        id: 'iaso.polio.label.sortAsc',
        defaultMessage: 'Sort ascending',
    },
    sortDesc: {
        id: 'iaso.polio.label.sortDesc',
        defaultMessage: 'Sort descending',
    },
    search: {
        id: 'iaso.polio.label.search',
        defaultMessage: 'Search',
    },
    fastPrevious: {
        id: 'iaso.polio.label.calendar.fastPrevious',
        defaultMessage: 'Previous 4 weeks',
    },
    previous: {
        id: 'iaso.polio.label.calendar.previous',
        defaultMessage: 'Previous week',
    },
    next: {
        id: 'iaso.polio.label.calendar.next',
        defaultMessage: 'Next week',
    },
    fastNext: {
        id: 'iaso.polio.label.calendar.fastNext',
        defaultMessage: 'Next 4 weeks',
    },
    selectDate: {
        id: 'iaso.polio.label.calendar.selectDate',
        defaultMessage: 'Select a date',
    },
    clear: {
        id: 'iaso.polio.label.clear',
        defaultMessage: 'Clear',
    },
    lqas: {
        id: 'iaso.polio.label.lqas',
        defaultMessage: 'LQAS',
    },
    childrenChecked: {
        id: 'iaso.polio.label.childrenChecked',
        defaultMessage: 'Children checked',
    },
    childrenMarked: {
        id: 'iaso.polio.label.childrenMarked',
        defaultMessage: 'Children with mark',
    },
    dictrictName: {
        id: 'iaso.polio.label.dictrictName',
        defaultMessage: 'Name',
    },
    round_1: {
        id: 'iaso.polio.label.round1',
        defaultMessage: 'Round 1',
    },
    round_2: {
        id: 'iaso.polio.label.round2',
        defaultMessage: 'Round 2',
    },
    evaluated: {
        id: 'iaso.polio.label.evaluated',
        defaultMessage: 'Evaluated',
    },
    passing: {
        id: 'iaso.polio.label.passed',
        defaultMessage: 'Passed',
    },
    '1lqasOK': {
        id: 'iaso.polio.label.passed',
        defaultMessage: 'Passed',
    },
    disqualified: {
        id: 'iaso.polio.label.disqualified',
        defaultMessage: 'Disqualified',
    },
    '2lqasDisqualified': {
        id: 'iaso.polio.label.disqualified',
        defaultMessage: 'Disqualified',
    },
    failing: {
        id: 'iaso.polio.label.failed',
        defaultMessage: 'Failed',
    },
    '3lqasFail': {
        id: 'iaso.polio.label.failed',
        defaultMessage: 'Failed',
    },
    districtsNotFound: {
        id: 'iaso.polio.label.districtsNotFound',
        defaultMessage: 'Districts not found',
    },
    districtName: {
        id: 'iaso.polio.label.name',
        defaultMessage: 'Name',
    },
    districtFound: {
        id: 'iaso.polio.label.districtFound',
        defaultMessage: 'District found',
    },
    datesIgnored: {
        id: 'iaso.polio.label.datesIgnored',
        defaultMessage: 'Dates ignored',
    },
    lqasResults: {
        id: 'iaso.polio.label.lqasResults',
        defaultMessage: 'LQAS results',
    },
    im: {
        id: 'iaso.polio.label.im',
        defaultMessage: 'IM',
    },
    '1imOK': {
        id: 'iaso.polio.label.imOK',
        defaultMessage: '>95%',
    },
    '2imWarning': {
        id: 'iaso.polio.label.imWarning',
        defaultMessage: '90%-94%',
    },
    '3imFail': {
        id: 'iaso.polio.label.imFail',
        defaultMessage: '<90%',
    },
    imResults: {
        id: 'iaso.polio.label.imResults',
        defaultMessage: 'IM Results',
    },
    enableSendWeeklyEmail: {
        id: 'iaso.polio.label.enableSendWeeklyEmail',
        defaultMessage: 'Send a weekly e-mail reminder',
    },
    emailListTooltip: {
        id: 'iaso.polio.label.emailListTooltip',
        defaultMessage: 'Change email list via country configuration',
    },
    emailListEmpty: {
        id: 'iaso.polio.label.emailListEmpty',
        defaultMessage: 'No email configured for this country',
    },
    emailListLabel: {
        id: 'iaso.polio.label.emailListLabel',
        defaultMessage: 'Configured emails :',
    },
    emailNotifyButton: {
        id: 'iaso.polio.label.emailNotifyButton',
        defaultMessage: 'Notify coordinators by e-mail',
    },
    lqasPerRegion: {
        id: 'iaso.polio.label.lqasPerRegion',
        defaultMessage:
            'Districts passing LQAS per region (based on districts found)',
    },
    imPerRegion: {
        id: 'iaso.polio.label.imPerRegion',
        defaultMessage:
            'Vaccination ratio per region (based on districts found)',
    },
    vaccinated: {
        id: 'iaso.polio.label.vaccinated',
        defaultMessage: 'Vaccinated',
    },
    spreadsheetImportTitle: {
        id: 'iaso.polio.label.spreadsheetImportTitle',
        defaultMessage: 'Imported from SpreadSheet : ',
    },
    childabsent: {
        id: 'iaso.polio.label.childabsent',
        defaultMessage: 'Child absent',
    },
    House_not_visited: {
        id: 'iaso.polio.label.house_not_visited',
        defaultMessage: 'House not visited',
    },
    Other: {
        id: 'iaso.polio.label.other',
        defaultMessage: 'Other',
    },
    Vaccinated_but_not_FM: {
        id: 'iaso.polio.label.vaccinated_but_not_fm',
        defaultMessage: 'Vaccinated but not marked',
    },
    Non_Compliance: {
        id: 'iaso.polio.label.non_compliance',
        defaultMessage: 'Non compliance',
    },
    Child_was_asleep: {
        id: 'iaso.polio.label.child_was_asleep',
        defaultMessage: 'Child asleep',
    },
    Child_is_a_visitor: {
        id: 'iaso.polio.label.child_is_a_visitor',
        defaultMessage: 'Child is a visitor',
    },
    reasonsNoFingerMarked: {
        id: 'iaso.polio.label.reasonsNoFingerMarked',
        defaultMessage: 'Reasons finger not marked',
    },
    childrenNoMark: {
        id: 'iaso.polio.label.childrenNoMark',
        defaultMessage: 'Children not marked',
    },
});

export default MESSAGES;
