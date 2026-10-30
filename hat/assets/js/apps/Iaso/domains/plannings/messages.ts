import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Planning',
        id: 'iaso.planning.title',
    },
    search: {
        defaultMessage: 'Search',
        id: 'iaso.search',
    },
    publishingStatus: {
        defaultMessage: 'Publishing status',
        id: 'iaso.label.publishingStatus',
    },
    all: {
        defaultMessage: 'Show all',
        id: 'iaso.label.showAll',
    },
    draft: {
        defaultMessage: 'Draft',
        id: 'iaso.label.draft',
    },
    published: {
        defaultMessage: 'Published',
        id: 'iaso.label.published',
    },
    startDatefrom: {
        id: 'iaso.label.startDatefrom',
        defaultMessage: 'Start date from',
    },
    endDateUntil: {
        id: 'iaso.label.endDateUntil',
        defaultMessage: 'End date until',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    startDate: {
        id: 'iaso.label.dateFrom',
        defaultMessage: 'Start date',
    },
    endDate: {
        id: 'iaso.label.dateTo',
        defaultMessage: 'End date',
    },
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
    team: {
        defaultMessage: 'Team',
        id: 'iaso.label.team',
    },
    assignments: {
        defaultMessage: 'Assignments',
        id: 'iaso.label.assignments',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    editPlanning: {
        id: 'iaso.label.editPlanning',
        defaultMessage: 'Edit planning',
    },
    createPlanning: {
        id: 'iaso.label.createPlanning',
        defaultMessage: 'Create planning',
    },
    missions: {
        defaultMessage: 'Missions',
        id: 'iaso.missions.title',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    create: {
        id: 'iaso.label.create',
        defaultMessage: 'Create',
    },
    selectOrgUnit: {
        id: 'iaso.plannings.label.selectOrgUnit',
        defaultMessage: 'Target geography',
    },
    duplicatePlanning: {
        id: 'iaso.plannings.label.duplicatePlanning',
        defaultMessage: 'Duplicate planning',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    projectsError: {
        id: 'iaso.snackBar.fetchProjectsError',
        defaultMessage: 'An error occurred while fetching projects list',
    },
    project: {
        id: 'iaso.datasources.label.project',
        defaultMessage: 'Project',
    },
    description: {
        id: 'iaso.versionsDialog.label.description',
        defaultMessage: 'Description',
    },
    invalidDate: {
        id: 'iaso.label.invalidDate',
        defaultMessage: 'Invalid date',
    },
    deletePlanning: {
        id: 'iaso.label.deletePlanning',
        defaultMessage: 'Delete planning : {planningName}',
    },
    deleteWarning: {
        id: 'iaso.label.deleteWarning',
        defaultMessage: 'Are you sure you want to delete {name}?',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    planningAndOrgUnit: {
        id: 'iaso.error.label.planningAndOrgUnit',
        defaultMessage: 'Planning and org unit must be in the same project',
    },
    planningAndForms: {
        id: 'iaso.error.label.planningAndForms',
        defaultMessage: 'Planning and forms must be in the same project',
    },
    planningAndTeams: {
        id: 'iaso.error.label.planningAndTeams',
        defaultMessage: 'Planning and teams must be in the same project',
    },
    planningAndTargetOrgUnitType: {
        id: 'iaso.error.label.planningAndTargetOrgUnitType',
        defaultMessage:
            'Planning and target org unit type must be in the same project',
    },
    noOrgUnitsOfTypeInHierarchy: {
        id: 'iaso.error.label.noOrgUnitsOfTypeInHierarchy',
        defaultMessage:
            'No org units of this type exist below the selected org unit',
    },
    planningsError: {
        id: 'iaso.snackBar.fetchPlanningsError',
        defaultMessage: 'An error occurred while fetching plannings list',
    },
    EndDateBeforeStartDate: {
        id: 'iaso.error.label.EndDateBeforeStartDate',
        defaultMessage: "End date can't before start date",
    },
    startDateAfterEndDate: {
        id: 'iaso.error.label.startDateAfterEndDate',
        defaultMessage: "Start date can't after end date",
    },
    publishedWithoutStartDate: {
        id: 'iaso.error.label.publishedWithoutStartDate',
        defaultMessage: 'Start date must be set when publishing',
    },
    publishedWithoutEndDate: {
        id: 'iaso.error.label.publishedWithoutEndDate',
        defaultMessage: 'End date must be set when publishing',
    },
    projectSelectHelperText: {
        id: 'iaso.label.projectSelectHelperText',
        defaultMessage: 'You must select a project first',
    },
    orgUnit: {
        id: 'iaso.label.orgUnitSingle',
        defaultMessage: 'Org unit',
    },
    pipelines: {
        id: 'iaso.label.pipelines',
        defaultMessage: 'Pipelines',
    },
    targetOrgUnitType: {
        id: 'iaso.label.targetOrgUnitType',
        defaultMessage: 'Assignments level',
    },
    targetOrgUnitTypeInfos: {
        id: 'iaso.label.targetOrgUnitTypeInfos',
        defaultMessage: 'Select the target geography first',
    },
    status: {
        id: 'iaso.label.status',
        defaultMessage: 'Status',
    },
    samplingResults: {
        id: 'iaso.plannings.label.samplingResults',
        defaultMessage: 'Sampling results',
    },
    orgUnitsCount: {
        id: 'iaso.plannings.label.orgUnitsCount',
        defaultMessage: 'Org units count',
    },
    created_at: {
        id: 'iaso.label.created_at',
        defaultMessage: 'Created',
    },
    seeSamplingResults: {
        id: 'iaso.plannings.label.seeSamplingResults',
        defaultMessage: 'See sampling results',
    },
    viewSamplingResultDetails: {
        id: 'iaso.plannings.label.viewSamplingResultDetails',
        defaultMessage: 'View sampling result details',
    },
    samplingName: {
        id: 'iaso.plannings.label.samplingName',
        defaultMessage: 'Sampling name',
    },
    samplingResultCreatedBy: {
        id: 'iaso.forms.created_by',
        defaultMessage: 'Created by',
    },
    samplingResultParameters: {
        id: 'iaso.plannings.label.samplingResultParameters',
        defaultMessage: 'Parameters',
    },
    selectSamplingResult: {
        id: 'iaso.plannings.label.selectSamplingResult',
        defaultMessage: 'Select sampling result',
    },
    openHexaIntegration: {
        defaultMessage: 'Sampling',
        id: 'iaso.assignment.openHexaIntegration',
    },
    pipeline: {
        defaultMessage: 'Pipeline',
        id: 'iaso.assignment.pipeline',
    },
    launch: {
        id: 'iaso.label.launch',
        defaultMessage: 'Launch',
    },
    QUEUED: {
        id: 'iaso.tasks.queued',
        defaultMessage: 'QUEUED',
    },
    RUNNING: {
        id: 'iaso.tasks.running',
        defaultMessage: 'RUNNING',
    },
    ERRORED: {
        id: 'iaso.tasks.errored',
        defaultMessage: 'ERRORED',
    },
    EXPORTED: {
        id: 'iaso.tasks.exported',
        defaultMessage: 'EXPORTED',
    },
    SUCCESS: {
        id: 'iaso.tasks.success',
        defaultMessage: 'SUCCESS',
    },
    SKIPPED: {
        id: 'iaso.tasks.skipped',
        defaultMessage: 'SKIPPED',
    },
    KILLED: {
        id: 'iaso.tasks.killed',
        defaultMessage: 'KILLED',
    },
    addLevel: {
        defaultMessage: 'Add level',
        id: 'iaso.openHexalabel.addLevel',
    },
    removeLevel: {
        defaultMessage: 'Remove level',
        id: 'iaso.openHexalabel.removeLevel',
    },
    collapse: {
        defaultMessage: 'Collapse',
        id: 'iaso.openHexalabel.collapse',
    },
    expand: {
        defaultMessage: 'Expand',
        id: 'iaso.openHexalabel.expand',
    },
    noParameters: {
        defaultMessage: 'No parameters',
        id: 'iaso.label.noParameters',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    criteria: {
        id: 'iaso.plannings.label.criteria',
        defaultMessage: 'Criteria',
    },
    quantity: {
        defaultMessage: 'Qty',
        id: 'iaso.label.quantityShort',
    },
    level: {
        defaultMessage: 'Level',
        id: 'iaso.forms.level',
    },
    excludedOrgUnits: {
        defaultMessage: 'Excluded org units',
        id: 'iaso.openHexalabel.excludedOrgUnits',
    },
    ruralUrban: {
        defaultMessage: 'Rural/Urban',
        id: 'iaso.openHexalabel.ruralUrban',
    },
    urban: {
        defaultMessage: 'Urban',
        id: 'iaso.openHexalabel.urban',
    },
    rural: {
        defaultMessage: 'Rural',
        id: 'iaso.openHexalabel.rural',
    },
    back: {
        defaultMessage: 'Back',
        id: 'iaso.label.back',
    },
    deleteAssignments: {
        id: 'iaso.assignment.deleteAssignmentsForPlanning',
        defaultMessage: 'Delete assignments for planning : {name}',
    },
    deleteAssignmentsWarning: {
        id: 'iaso.assignment.deleteAssignmentsWarning',
        defaultMessage: 'Are you sure you want to delete {count} assignments?',
    },
    deleteAssignmentsInfos: {
        id: 'iaso.assignment.deleteAssignmentsInfos',
        defaultMessage: 'Please delete all assignments first',
    },
    emptyAssignments: {
        id: 'iaso.assignment.emptyAssignments',
        defaultMessage: 'Delete assignments',
    },
    progress: {
        defaultMessage: 'Progress',
        id: 'iaso.tasks.progress',
    },
    bulkDeleteAssignmentsSuccess: {
        id: 'iaso.assignment.bulkDeleteAssignmentsSuccess',
        defaultMessage: 'Assignments deleted successfully',
    },
    deleteAllAssignments: {
        defaultMessage: 'Delete all assignments',
        id: 'iaso.assignment.deleteAllAssignments',
    },
    planningAlreadyPublished: {
        id: 'iaso.planning.label.planningAlreadyPublished',
        defaultMessage: 'Planning is already published',
    },
    confirm: {
        defaultMessage: 'Confirm',
        id: 'iaso.label.confirm',
    },
    planningWarningTitle: {
        defaultMessage: 'Planning edition warning',
        id: 'iaso.planning.label.planningWarningTitle',
    },
    planningWarningMessage: {
        defaultMessage:
            'Planning seems to be active, editing information might impact the actual data collection',
        id: 'iaso.planning.label.planningWarningMessage',
    },
    planning: {
        defaultMessage: 'Planning',
        id: 'iaso.label.planning',
    },
    add: {
        defaultMessage: 'Add',
        id: 'iaso.label.add',
    },
    addMissions: {
        defaultMessage: 'Add missions',
        id: 'iaso.plannings.label.addMissions',
    },
    addMissionsToPlanning: {
        defaultMessage: 'Add missions to this planning',
        id: 'iaso.plannings.label.addMissionsToPlanning',
    },
    searchMission: {
        defaultMessage: 'Search a mission',
        id: 'iaso.plannings.label.searchMission',
    },
    alreadyLinked: {
        defaultMessage: 'Already linked',
        id: 'iaso.plannings.label.alreadyLinked',
    },
    linkMission: {
        defaultMessage: 'Link mission',
        id: 'iaso.plannings.label.linkMission',
    },
    notSavedYet: {
        defaultMessage: 'Not saved yet',
        id: 'iaso.plannings.label.notSavedYet',
    },
    willBeUnlinked: {
        defaultMessage: 'Will be unlinked',
        id: 'iaso.plannings.label.willBeUnlinked',
    },
    unlinkMission: {
        defaultMessage: 'Unlink mission',
        id: 'iaso.plannings.label.unlinkMission',
    },
    relinkMission: {
        defaultMessage: 'Undo unlink',
        id: 'iaso.plannings.label.relinkMission',
    },
    type: {
        defaultMessage: 'Type',
        id: 'iaso.label.type',
    },
    linkedMissionsCount: {
        defaultMessage: '{count} linked',
        id: 'iaso.plannings.label.linkedMissionsCount',
    },
    noMissionLinked: {
        defaultMessage: 'No mission linked yet',
        id: 'iaso.plannings.label.noMissionLinked',
    },
    noMissionLinkedDescription: {
        defaultMessage:
            'Link an existing mission or create a new one to define what agents collect on the field.',
        id: 'iaso.plannings.label.noMissionLinkedDescription',
    },
    planningDetails: {
        defaultMessage: 'Planning details',
        id: 'iaso.plannings.label.planningDetails',
    },
    viewDetails: {
        defaultMessage: 'View details',
        id: 'iaso.label.viewDetails',
    },
    deprecated: {
        defaultMessage: 'Deprecated',
        id: 'iaso.plannings.label.deprecated',
    },
    deprecatedPlanningInfos: {
        defaultMessage:
            'This planning was created before missions were introduced. It is read only.',
        id: 'iaso.plannings.label.deprecatedPlanningInfos',
    },
    openAssignments: {
        defaultMessage: 'Open assignments',
        id: 'iaso.plannings.label.openAssignments',
    },
    assignmentsForPlanning: {
        defaultMessage: 'Assignments for planning: {name}',
        id: 'iaso.plannings.label.assignmentsForPlanning',
    },
    info: {
        defaultMessage: 'Info',
        id: 'iaso.plannings.label.info',
    },
    levelsAndTeams: {
        defaultMessage: 'Levels & teams',
        id: 'iaso.plannings.label.levelsAndTeams',
    },
    targetGeographyAndRootTeam: {
        defaultMessage: 'Target geography and root team',
        id: 'iaso.plannings.label.targetGeographyAndRootTeam',
    },
    targetGeographyAndRootTeamInfos: {
        defaultMessage:
            'Select the org unit this planning covers, then the team responsible for it. The team hierarchy defines the levels below.',
        id: 'iaso.plannings.label.targetGeographyAndRootTeamInfos',
    },
    rootTeam: {
        defaultMessage: 'Root team',
        id: 'iaso.plannings.label.rootTeam',
    },
    createNewRootTeam: {
        defaultMessage: 'Create new root team',
        id: 'iaso.plannings.label.createNewRootTeam',
    },
    or: {
        defaultMessage: 'or',
        id: 'iaso.plannings.label.or',
    },
    teamHierarchy: {
        defaultMessage: 'Team hierarchy',
        id: 'iaso.plannings.label.teamHierarchy',
    },
    teamHierarchyInfos: {
        defaultMessage:
            'Build the hierarchy below the root team. Changes update the levels automatically.',
        id: 'iaso.plannings.label.teamHierarchyInfos',
    },
    selectRootTeamFirst: {
        defaultMessage: 'Select a root team to build its hierarchy.',
        id: 'iaso.plannings.label.selectRootTeamFirst',
    },
    orgUnitsToAssign: {
        defaultMessage: 'Org units to assign',
        id: 'iaso.plannings.label.orgUnitsToAssign',
    },
    orgUnitLevelsInfos: {
        defaultMessage:
            '{count, plural, one {# level} other {# levels}} computed from the team hierarchy. Each level uses org unit types deeper than the level above, optionally limited to groups.',
        id: 'iaso.plannings.label.orgUnitLevelsInfos',
    },
    levelNumber: {
        defaultMessage: 'Level {number}',
        id: 'iaso.plannings.label.levelNumber',
    },
    rootLevel: {
        defaultMessage: 'Root level',
        id: 'iaso.plannings.label.rootLevel',
    },
    deepestLevel: {
        defaultMessage: 'Deepest level',
        id: 'iaso.plannings.label.deepestLevel',
    },
    teamsAndUsers: {
        defaultMessage: 'Teams and users',
        id: 'iaso.plannings.label.teamsAndUsers',
    },
    orgUnitTypes: {
        defaultMessage: 'Org unit types',
        id: 'iaso.plannings.label.orgUnitTypes',
    },
    orgUnitGroups: {
        defaultMessage: 'Org unit groups',
        id: 'iaso.plannings.label.orgUnitGroups',
    },
    orgUnits: {
        defaultMessage: 'Org units',
        id: 'iaso.plannings.label.orgUnits',
    },
    allOrgUnits: {
        defaultMessage: 'All org units',
        id: 'iaso.plannings.label.allOrgUnits',
    },
    selectGeographyAndRootTeamFirst: {
        defaultMessage:
            'Select a target geography and a root team to define the levels.',
        id: 'iaso.plannings.label.selectGeographyAndRootTeamFirst',
    },
    mixedOrgUnitTypeDepths: {
        defaultMessage: 'Org unit types of a level must be at the same depth',
        id: 'iaso.plannings.label.mixedOrgUnitTypeDepths',
    },
    notDeeperThanLevelAbove: {
        defaultMessage: 'Org unit types must be deeper than the level above',
        id: 'iaso.plannings.label.notDeeperThanLevelAbove',
    },
    groupsWithoutLevelOrgUnits: {
        defaultMessage: "No org units of this level's types in: {groups}",
        id: 'iaso.plannings.label.groupsWithoutLevelOrgUnits',
    },
    explore: {
        defaultMessage: 'Explore',
        id: 'iaso.plannings.label.explore',
    },
    exploreModeTooltip: {
        defaultMessage: 'Browse teams and open subteams',
        id: 'iaso.plannings.label.exploreModeTooltip',
    },
    assign: {
        defaultMessage: 'Assign',
        id: 'iaso.plannings.label.assign',
    },
    assignModeTooltip: {
        defaultMessage: 'Assign org units to team members',
        id: 'iaso.plannings.label.assignModeTooltip',
    },
    assignmentsMode: {
        defaultMessage: 'Mode',
        id: 'iaso.plannings.label.assignmentsMode',
    },
    editingPublishedPlanning: {
        defaultMessage: 'You are editing a published planning.',
        id: 'iaso.plannings.label.editingPublishedPlanning',
    },
    editingPublishedPlanningDetails: {
        defaultMessage:
            'Every assignment change is sent to the agents concerned at their next synchronisation and can change the work they are doing on the field.',
        id: 'iaso.plannings.label.editingPublishedPlanningDetails',
    },
    teamsPanelExploreHelp: {
        defaultMessage:
            'Click a member to open it and see how its area is split. Switch to Assign to change assignments.',
        id: 'iaso.plannings.label.teamsPanelExploreHelp',
    },
    teamsPanelAssignNote: {
        defaultMessage:
            'Clicking an org unit already assigned to the selected member unassigns it. Reassigning an org unit clears the assignments made below it.',
        id: 'iaso.plannings.label.teamsPanelAssignNote',
    },
    hideTeams: {
        defaultMessage: 'Hide teams',
        id: 'iaso.plannings.label.hideTeams',
    },
    openTeam: {
        defaultMessage: 'Open {name}',
        id: 'iaso.plannings.label.openTeam',
    },
    targetGeographyCaption: {
        defaultMessage: '{name} (target geography)',
        id: 'iaso.plannings.label.targetGeographyCaption',
    },
    map: {
        defaultMessage: 'Map',
        id: 'iaso.label.map',
    },
    list: {
        defaultMessage: 'List',
        id: 'iaso.label.list',
    },
    parent: {
        defaultMessage: 'Parent',
        id: 'iaso.label.parent',
    },
    assignment: {
        defaultMessage: 'Assignment',
        id: 'iaso.plannings.label.assignment',
    },
    below: {
        defaultMessage: 'Below',
        id: 'iaso.plannings.label.below',
    },
    belowAssigned: {
        defaultMessage: '{assigned} of {total} assigned',
        id: 'iaso.plannings.label.belowAssigned',
    },
    notOnMap: {
        defaultMessage: 'No shape or point: not shown on the map',
        id: 'iaso.plannings.label.notOnMap',
    },
    noOrgUnitsToAssign: {
        defaultMessage: 'No org units to assign on this level',
        id: 'iaso.plannings.label.noOrgUnitsToAssign',
    },
    mapExploreHintTeams: {
        defaultMessage:
            'Explore: each org unit is colored by the sub-team it is assigned to. Click it to open the sub-team and see how its area is split. Switch to Assign to change assignments.',
        id: 'iaso.plannings.label.mapExploreHintTeams',
    },
    mapExploreHintUsers: {
        defaultMessage:
            'Explore: each org unit is colored by the user it is assigned to. Switch to Assign to change assignments.',
        id: 'iaso.plannings.label.mapExploreHintUsers',
    },
    mapHintNoMember: {
        defaultMessage:
            'This team has no member. Add members in the team hierarchy of the planning.',
        id: 'iaso.plannings.label.mapHintNoMember',
    },
    showHelp: {
        defaultMessage: 'Show help',
        id: 'iaso.plannings.label.showHelp',
    },
    hideHelp: {
        defaultMessage: 'Hide help',
        id: 'iaso.plannings.label.hideHelp',
    },
    legend: {
        defaultMessage: 'Legend',
        id: 'iaso.plannings.label.legend',
    },
    assignedTo: {
        defaultMessage: 'Assigned to',
        id: 'iaso.plannings.label.assignedTo',
    },
    unassigned: {
        defaultMessage: 'Unassigned',
        id: 'iaso.plannings.label.unassigned',
    },
    areaOf: {
        defaultMessage: 'Area of {name}',
        id: 'iaso.plannings.label.areaOf',
    },
    orgUnitsOffMap: {
        defaultMessage:
            '{count, plural, ' +
            'one {# org unit has no shape or point. It is not on the map but appears in the list.} ' +
            'other {# org units have no shape or point. They are not on the map but appear in the list.}}',
        id: 'iaso.plannings.label.orgUnitsOffMap',
    },
});

export default MESSAGES;
