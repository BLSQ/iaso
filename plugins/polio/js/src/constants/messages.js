import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    polio: {
        defaultMessage: 'Polio',
        id: 'iaso.label.polio',
    },
    scope_per_round: {
        defaultMessage: 'Separate scope per round',
        id: 'iaso.polio.label.scope_per_round',
    },
    helpTextEditVaccineViaScope: {
        defaultMessage: 'The list of vaccines comes from the scope',
        id: 'iaso.polio.label.helpTextEditVaccineViaScope',
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
        id: 'iaso.polio.label.name',
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
    startDateAfterEndDate: {
        id: 'iaso.polio.form.validator.error.startDateAfterEndDate',
        defaultMessage: "Start date can't be after end date",
    },
    startDateBeforePreviousEndDate: {
        id: 'iaso.polio.form.validator.error.startDateBeforePreviousEndDate',
        defaultMessage:
            "Start date can't be before or equal previous round end date",
    },
    endDateAfterNextStartDate: {
        id: 'iaso.polio.form.validator.error.endDateAfterNextStartDate',
        defaultMessage:
            "End date can't be after or equal next round start date",
    },
    positiveInteger: {
        id: 'iaso.polio.form.validator.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    positiveNumber: {
        id: 'iaso.polio.form.validator.error.positiveNumber',
        defaultMessage: 'Please use a positive number',
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
    virusNotificationDate: {
        id: 'iaso.polio.form.label.virusNotificationDate',
        defaultMessage: 'Virus notification date',
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
    targetpopulationRound: {
        id: 'iaso.polio.form.label.targetpopulationRound',
        defaultMessage: 'Target population Round',
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
    costRound: {
        id: 'iaso.polio.form.label.costRound',
        defaultMessage: 'Cost Round',
    },
    costPerChildRound: {
        id: 'iaso.polio.form.label.costPerChildRound',
        defaultMessage: 'Cost/Child Round',
    },
    costPerChildTotal: {
        id: 'iaso.polio.form.label.costPerChildTotal',
        defaultMessage: 'Cost/Child Total',
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
    restoreWarning: {
        id: 'iaso.polio.label.restoreWarning',
        defaultMessage: 'Are you sure you want to restore this campaign?',
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
    RoundStartFrom: {
        id: 'iaso.polio.label.RoundStartFrom',
        defaultMessage: 'Round start date from',
    },
    RoundStartTo: {
        id: 'iaso.polio.label.RoundStartTo',
        defaultMessage: 'Round start date to',
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
    caregivers_informed: {
        id: 'iaso.polio.label.caregivers_informed',
        defaultMessage: 'Caregivers informed',
    },
    Others: {
        id: 'iaso.polio.label.others',
        defaultMessage: 'Others',
    },
    TV: {
        id: 'iaso.polio.label.TV',
        defaultMessage: 'TV',
    },
    Radio: {
        id: 'iaso.polio.label.Radio',
        defaultMessage: 'Radio',
    },
    Gong_gong: {
        id: 'iaso.polio.label.Gong_gong',
        defaultMessage: 'Gong gong',
    },
    Mob_VanPA: {
        id: 'iaso.polio.label.Mob_VanPA',
        defaultMessage: 'Mob_VanPA',
    },
    H2H_Mobilizer: {
        id: 'iaso.polio.label.H2H_Mobilizer',
        defaultMessage: 'H2H_Mobilizer',
    },
    IEC_Materials: {
        id: 'iaso.polio.label.IEC_Materials',
        defaultMessage: 'IEC_Materials',
    },
    Volunteers: {
        id: 'iaso.polio.label.Volunteers',
        defaultMessage: 'Volunteers',
    },
    Health_worker: {
        id: 'iaso.polio.label.Health_worker',
        defaultMessage: 'Health worker',
    },
    Opinion_leader: {
        id: 'iaso.polio.label.Opinion_leader',
        defaultMessage: 'Opinion leader',
    },
    Com_Info_centre: {
        id: 'iaso.polio.label.Com_Info_centre',
        defaultMessage: 'Com_Info_centre',
    },
    Religious_leader: {
        id: 'iaso.polio.label.Religious_leader',
        defaultMessage: 'Religious leader',
    },
    MobileMessaging_SocialMedia: {
        id: 'iaso.polio.label.MobileMessaging_SocialMedia',
        defaultMessage: 'Mobile messaging or social media',
    },
    numberCaregiversInformed: {
        id: 'iaso.polio.label.numberCaregiversInformed',
        defaultMessage: 'Number of caregivers informed',
    },
    ratioCaregiversInformed: {
        id: 'iaso.polio.label.ratioCaregiversInformed',
        defaultMessage: 'caregivers informed',
    },
    imGlobal: {
        id: 'iaso.polio.label.imGlobal',
        defaultMessage: 'Global IM',
    },
    imIHH: {
        id: 'iaso.polio.label.imIHH',
        defaultMessage: 'IM in household',
    },
    imOHH: {
        id: 'iaso.polio.label.imOHH',
        defaultMessage: 'IM out of household',
    },
    Tot_child_Absent_HH: {
        id: 'iaso.polio.label.Tot_child_Absent_HH',
        defaultMessage: 'Child absent',
    },
    Tot_child_Asleep_HH: {
        id: 'iaso.polio.label.Tot_child_Asleep_HH',
        defaultMessage: 'Child asleep',
    },
    Tot_child_NC_HH: {
        id: 'iaso.polio.label.Tot_child_NC_HH',
        defaultMessage: 'Refusal',
    },
    Tot_child_NotVisited_HH: {
        id: 'iaso.polio.label.Tot_child_NotVisited_HH',
        defaultMessage: 'Not visited',
    },
    Tot_child_NotRevisited_HH: {
        id: 'iaso.polio.label.Tot_child_NotRevisited_HH',
        defaultMessage: 'Not revisited',
    },
    Tot_child_Others_HH: {
        id: 'iaso.polio.label.Tot_child_Others_HH',
        defaultMessage: 'Other',
    },
    Tot_child_VaccinatedRoutine: {
        id: 'iaso.polio.label.Tot_child_VaccinatedRoutine',
        defaultMessage: 'Child vaccinated in routine',
    },
    noDataFound: {
        id: 'iaso.polio.label.noDataFound',
        defaultMessage: 'No data found',
    },
    collectionStats: {
        id: 'iaso.polio.label.collectionStats',
        defaultMessage: 'Collection stats',
    },
    reportingDistricts: {
        id: 'iaso.polio.label.reportingDistricts',
        defaultMessage: 'Reporting districts',
    },
    total_child_checked: {
        id: 'iaso.polio.label.total_child_checked',
        defaultMessage: 'Children seen',
    },
    total_sites_visited: {
        id: 'iaso.polio.label.total_sites_visited',
        defaultMessage: 'Sites visited',
    },
    ratioUnvaccinated: {
        id: 'iaso.polio.label.ratioUnvaccinated',
        defaultMessage: 'Unvaccinated',
    },
    mainCaregiverInfoSource: {
        id: 'iaso.polio.label.mainCaregiverInfoSource',
        defaultMessage: 'Main source of information',
    },
    totalCaregiversSurveyed: {
        id: 'iaso.polio.label.totalCaregiversSurveyed',
        defaultMessage: 'Caregivers surveyed',
    },
    noScope: {
        id: 'iaso.polio.label.noScope',
        defaultMessage: 'Plese select a scope for the campaign',
    },
    districtsNeedMatching: {
        id: 'iaso.polio.label.districtsNeedMatching',
        defaultMessage: 'Some districts need matching. Please contact an admin',
    },
    noScopeFound: {
        id: 'iaso.polio.label.noScopeFound',
        defaultMessage: 'No scope found',
    },
    childrenNfmAbsent: {
        id: 'iaso.polio.label.childrenNfmAbsent',
        defaultMessage: 'Children absent',
    },
    reasonsForAbsence: {
        id: 'iaso.polio.label.reasonsForAbsence',
        defaultMessage: 'Reasons for absence of non-vaccinated children',
    },
    Market: {
        id: 'iaso.polio.label.market',
        defaultMessage: 'Market',
    },
    Tot_child_Abs_Market: {
        id: 'iaso.polio.label.market',
        defaultMessage: 'Market',
    },
    In_playground: {
        id: 'iaso.polio.label.playground',
        defaultMessage: 'At playground',
    },
    Tot_child_Abs_Play_areas: {
        id: 'iaso.polio.label.playground',
        defaultMessage: 'At playground',
    },
    Farm: {
        id: 'iaso.polio.label.farm',
        defaultMessage: 'Farm',
    },
    Tot_child_Abs_Farm: {
        id: 'iaso.polio.label.farm',
        defaultMessage: 'Farm',
    },
    School: {
        id: 'iaso.polio.label.school',
        defaultMessage: 'School',
    },
    Tot_child_Abs_School: {
        id: 'iaso.polio.label.school',
        defaultMessage: 'School',
    },
    Travelled: {
        id: 'iaso.polio.label.travelled',
        defaultMessage: 'Travelling',
    },
    Tot_child_Abs_Travelling: {
        id: 'iaso.polio.label.travelled',
        defaultMessage: 'Travelling',
    },
    unknown: {
        id: 'iaso.polio.label.unknown',
        defaultMessage: 'Unknown',
    },
    Tot_child_Abs_Social_event: {
        id: 'iaso.polio.label.socialEvent',
        defaultMessage: 'Social event',
    },
    Tot_child_Abs_Parent_Absent: {
        id: 'iaso.polio.label.parentAbsent',
        defaultMessage: 'Parent absent',
    },
    Tot_child_Abs_Other: {
        id: 'iaso.polio.label.other',
        defaultMessage: 'Other',
    },
    showOnlyDeleted: {
        id: 'iaso.polio.showDeletedCampaigns',
        defaultMessage: 'Show deleted campaigns',
    },
    deleted_at: {
        id: 'iaso.forms.deleted_at',
        defaultMessage: 'Deleted',
    },
    restoreCampaign: {
        id: 'iaso.polio.restoreCampaign',
        defaultMessage: 'Restore campaign',
    },
    all: {
        id: 'iaso.polio.label.all',
        defaultMessage: 'All',
    },
    ALL: {
        id: 'iaso.polio.label.all',
        defaultMessage: 'All',
    },
    regular: {
        id: 'iaso.polio.label.regular',
        defaultMessage: 'Regular',
    },
    campaignType: {
        id: 'iaso.polio.label.campaignType',
        defaultMessage: 'Campaign type',
    },
    lqasImDateTooltip: {
        id: 'iaso.polio.tooltip.label.lqasImDate',
        defaultMessage:
            'No date found in campaign data, using default value based on round date',
    },
    noDateFound: {
        id: 'iaso.polio.placeholder.noDateFound',
        defaultMessage: 'No date found',
    },
    preparednessIntro: {
        id: 'iaso.polio.preparednessIntro',
        defaultMessage:
            'Configure the Google Sheets that will be used to import the preparedness data for the round.',
    },
    preparednessRoundStarted: {
        id: 'iaso.polio.preparednessRoundStarted',
        defaultMessage: "Preparedness can't be edited if round already started",
    },
    badRoundNumbers: {
        id: 'iaso.polio.badRoundNumbers',
        defaultMessage: 'Forms with the wrong round number',
    },
    groupedCampaigns: {
        defaultMessage: 'Grouped campaigns',
        id: 'iaso.polio.label.groupedCampaigns',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    deleteTitle: {
        id: 'iaso.entities.dialog.deleteTitle',
        defaultMessage: 'Are you sure you want to delete this entity?',
    },
    deleteText: {
        id: 'iaso.label.deleteText',
        defaultMessage: 'This operation cannot be undone.',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    editGroupedCampaign: {
        id: 'iaso.polio.label.editGroupedCampaign',
        defaultMessage: 'Edit grouped campaign',
    },
    campaignsToLink: {
        id: 'iaso.polio.label.campaignsToLink',
        defaultMessage: 'Campaigns to link',
    },
    testCampaign: {
        id: 'iaso.polio.label.testCampaign',
        defaultMessage: 'Test campaign',
    },
    testCampaigns: {
        id: 'iaso.polio.label.testCampaigns',
        defaultMessage: 'Test campaigns',
    },
    round: {
        id: 'iaso.polio.label.round',
        defaultMessage: 'Round',
    },
    rounds: {
        id: 'iaso.polio.form.label.rounds',
        defaultMessage: 'Rounds',
    },
    roundEmptyStartDate: {
        id: 'iaso.polio.forms.emptyStartDate',
        defaultMessage: 'Round {roundNumber} has no start date',
    },
    roundEmptyEndDate: {
        id: 'iaso.polio.forms.emptyEndDate',
        defaultMessage: 'Round {roundNumber} has no end date',
    },
    deleteRound: {
        id: 'iaso.polio.forms.deleteRound',
        defaultMessage: 'Delete round',
    },
    lastRound: {
        id: 'iaso.polio.label.lastRound',
        defaultMessage: 'Last round',
    },
    fieldRequired: {
        id: 'iaso.polio.form.fieldRequired',
        defaultMessage: 'This field is required',
    },
    invalidDate: {
        id: 'iaso.polio.form.invalidDate',
        defaultMessage: 'Date is invalid',
    },
    startDatefrom: {
        id: 'iaso.label.startDatefrom',
        defaultMessage: 'Start date from',
    },
    endDateUntil: {
        id: 'iaso.label.endDateUntil',
        defaultMessage: 'End date until',
    },
    addCampaign: {
        id: 'iaso.polio.budget.label.addCampaign',
        defaultMessage: 'Add campaign',
    },
    budgetDetails: {
        id: 'iaso.polio.budget.title.budgetDetails',
        defaultMessage: 'Budget details',
    },
    details: {
        defaultMessage: 'Details',
        id: 'iaso.label.details',
    },
    author: {
        defaultMessage: 'Author',
        id: 'iaso.polio.label.author',
    },
    destination: {
        defaultMessage: 'Destination',
        id: 'iaso.polio.label.destination',
    },
    event: {
        defaultMessage: 'Event',
        id: 'iaso.polio.label.event',
    },
    note: {
        defaultMessage: 'note',
        id: 'iaso.polio.label.note',
    },
    notes: {
        defaultMessage: 'notes',
        id: 'iaso.polio.label.notes',
    },
    submission: {
        defaultMessage: 'Submission',
        id: 'iaso.polio.label.submission',
    },
    comments: {
        defaultMessage: 'Comments',
        id: 'iaso.polio.label.comments',
    },
    comment: {
        defaultMessage: 'Comment',
        id: 'iaso.polio.label.comment',
    },
    validation_ongoing: {
        defaultMessage: 'Approval ongoing',
        id: 'iaso.polio.label.approval_ongoing',
    },
    validated: {
        defaultMessage: 'Approved',
        id: 'iaso.polio.label.approved',
    },
    rejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.polio.label.rejected',
    },
    newBudgetStep: {
        defaultMessage: 'New budget step',
        id: 'iaso.polio.label.newBudgetStep',
    },
    resendFiles: {
        defaultMessage: 'Retry sending files',
        id: 'iaso.polio.label.resendFiles',
    },
    addStep: {
        defaultMessage: 'Add step',
        id: 'iaso.polio.label.addStep',
    },
    send: {
        defaultMessage: 'Send',
        id: 'iaso.polio.label.send',
    },
    eventType: {
        defaultMessage: 'Type',
        id: 'iaso.polio.label.eventType',
    },
    cc_emails: {
        defaultMessage: 'Cc emails',
        id: 'iaso.polio.label.cc_emails',
    },
    filesUpload: {
        defaultMessage: 'Files',
        id: 'iaso.polio.label.filesUpload',
    },
    viewFiles: {
        defaultMessage: 'View files',
        id: 'iaso.polio.label.viewFiles',
    },
    noFile: {
        defaultMessage: 'No file found',
        id: 'iaso.polio.label.noFile',
    },
    steps: {
        defaultMessage: 'Steps',
        id: 'iaso.polio.label.steps',
    },
    budgetFiles: {
        defaultMessage: '{type} sent by {author} to {recipients} on {date}',
        id: 'iaso.polio.label.budgetFiles',
    },
    latestEventDate: {
        defaultMessage: 'Latest event date',
        id: 'iaso.polio.label.latestEventDate',
    },
    latestEvent: {
        defaultMessage: 'Latest event',
        id: 'iaso.polio.label.latestEvent',
    },
    noBudgetSubmitted: {
        defaultMessage: 'No budget submitted',
        id: 'iaso.polio.label.noBudgetSubmitted',
    },
    budgetEventCreated: {
        defaultMessage: 'New budget step created',
        id: 'iaso.polio.label.budgetEventCreated',
    },
    tryUpdateStep: {
        defaultMessage: 'Resend budget data?',
        id: 'iaso.polio.title.tryUpdateStep',
    },
    budgetFilesUploaded: {
        defaultMessage: 'Budget files uploaded',
        id: 'iaso.polio.label.budgetFilesUploaded',
    },
    budgetEventFinalized: {
        defaultMessage: 'Budget event finalized',
        id: 'iaso.polio.label.budgetEventFinalized',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    validation: {
        id: 'iaso.polio.forms.options.approval',
        defaultMessage: 'Approval',
    },
    emailFormat: {
        id: 'iaso.forms.options.emailFormat',
        defaultMessage: 'Please use correctly formatted email addresses',
    },
    urlFormat: {
        id: 'iaso.forms.options.urlFormat',
        defaultMessage: 'Please use correctly formatted URL',
    },
    budgetTypeError: {
        id: 'iaso.forms.options.budgetTypeError',
        defaultMessage:
            'Value should be one of "submission", "comments" or "validation"',
    },
    links: {
        defaultMessage: 'Links',
        id: 'iaso.label.links',
    },
    deleteBudgetEvent: {
        defaultMessage: 'Delete budget event',
        id: 'iaso.polio.label.deleteBudgetEvent',
    },
    showDeleted: {
        id: 'iaso.polio.label.showDeleted',
        defaultMessage: 'Show deleted',
    },
    restore: {
        id: 'iaso.polio.label.restore',
        defaultMessage: 'Restore',
    },
    internal: {
        id: 'iaso.polio.label.internal',
        defaultMessage: 'Internal',
    },
    approve: {
        id: 'iaso.polio.label.approve',
        defaultMessage: 'Approve',
    },
    approveBudgetForCampaign: {
        id: 'iaso.polio.label.approveBudgetForCampaign',
        defaultMessage: 'Approve budget for campaign: {campaign}',
    },
    approveBudget: {
        id: 'iaso.polio.label.approveBudget',
        defaultMessage: 'Approve budget?',
    },
    rejectBudget: {
        id: 'iaso.polio.label.rejectBudget',
        defaultMessage: 'Reject budget?',
    },
    sendComment: {
        id: 'iaso.polio.label.sendComment',
        defaultMessage: 'Send comment',
    },
    rejectBudgetForCampaign: {
        id: 'iaso.polio.label.rejectBudgetForCampaign',
        defaultMessage: 'Reject budget for campaign: {campaign}',
    },
    Community_leader: {
        id: 'iaso.polio.label.Community_leader',
        defaultMessage: 'Community leader',
    },
    Neighbour: {
        id: 'iaso.polio.label.Neighbour',
        defaultMessage: 'Neighbour',
    },
    Teachers_Student: {
        id: 'iaso.polio.label.Teachers_Student',
        defaultMessage: 'Teachers',
    },
    Town_crier: {
        id: 'iaso.polio.label.Town_crier',
        defaultMessage: 'Town crier',
    },
    by: {
        id: 'iaso.polio.label.by',
        defaultMessage: 'by {author}',
    },
    onDate: {
        id: 'iaso.polio.label.onDate',
        defaultMessage: 'on {date}',
    },
    seeFullComment: {
        id: 'iaso.polio.label.seeFullComment',
        defaultMessage: 'See full comment',
    },
    files: {
        id: 'iaso.polio.label.files',
        defaultMessage: 'files',
    },
    see: {
        id: 'iaso.polio.label.see',
        defaultMessage: 'See',
    },
    add: {
        id: 'iaso.polio.label.add',
        defaultMessage: 'Add',
    },
    cannotDisplayMap: {
        id: 'iaso.polio.label.cannotDisplayMap',
        defaultMessage: 'Cannot display map',
    },
    amount: {
        id: 'iaso.polio.label.amount',
        defaultMessage: 'Amount',
    },
    review: {
        id: 'iaso.polio.label.review',
        defaultMessage: 'Review',
    },
    transmission: {
        id: 'iaso.polio.label.transmission',
        defaultMessage: 'Transmission',
    },
    feedback: {
        id: 'iaso.polio.label.feedback',
        defaultMessage: 'Feedback',
    },
    request: {
        id: 'iaso.polio.label.request',
        defaultMessage: 'Request',
    },
    seeProcedure: {
        id: 'iaso.polio.label.seeProcedure',
        defaultMessage: 'See procedure',
    },
    sentToTeam: {
        id: 'iaso.polio.label.sentToTeam',
        defaultMessage: 'Sent to team',
    },
    sentByTeam: {
        id: 'iaso.polio.label.sentByTeam',
        defaultMessage: 'Sent by team',
    },
    exportToPdf: {
        id: 'iaso.polio.label.exportToPdf',
        defaultMessage: 'Export to pdf',
    },
    exportToExcel: {
        id: 'iaso.polio.label.exportToExcel',
        defaultMessage: 'Export to excel',
    },
    userWithoutTeam: {
        id: 'iaso.polio.error.label.userWithoutTeam',
        defaultMessage: 'User should be part of a team',
    },
    userNeedsTeam: {
        id: 'iaso.polio.error.label.userNeedsTeam',
        defaultMessage:
            'You need to be part of a team to create or edit budget events',
    },
});

export default MESSAGES;
