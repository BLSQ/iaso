import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    reviewChangeProposals: {
        defaultMessage: 'Review change proposals',
        id: 'iaso.label.reviewChangeProposals',
    },
    reviewChangeProposal: {
        defaultMessage: 'Change proposals for {name}',
        id: 'iaso.label.reviewChangeProposal',
    },
    orgUnitType: {
        id: 'iaso.forms.org_unit_type_id',
        defaultMessage: 'Org unit type',
    },
    status: {
        id: 'iaso.forms.status',
        defaultMessage: 'Status',
    },
    parent: {
        id: 'iaso.label.parent',
        defaultMessage: 'Parent',
    },
    group: {
        defaultMessage: 'Group',
        id: 'iaso.label.group',
    },
    projects: {
        defaultMessage: 'Projects',
        id: 'iaso.label.projects',
    },
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    name: {
        defaultMessage: 'Name',
        id: 'iaso.label.name',
    },
    orgUnitsType: {
        defaultMessage: 'Org unit type',
        id: 'iaso.label.orgUnitsType',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    groups: {
        defaultMessage: 'Groups',
        id: 'iaso.label.groups',
    },
    new: {
        defaultMessage: 'New',
        id: 'iaso.forms.newCap',
    },
    rejected: {
        defaultMessage: 'Rejected',
        id: 'iaso.forms.rejectedCap',
    },
    approved: {
        defaultMessage: 'Approved',
        id: 'iaso.label.approved',
    },
    updated_at: {
        id: 'iaso.forms.updated_at',
        defaultMessage: 'Updated',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    created_by: {
        id: 'iaso.label.created_by',
        defaultMessage: 'Created by',
    },
    updated_by: {
        id: 'iaso.label.updated_by',
        defaultMessage: 'Updated by',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    validateSelected: {
        id: 'iaso.label.validateSelected',
        defaultMessage: 'Approve selected change(s)',
    },
    validateOrRejectChanges: {
        id: 'iaso.label.validateOrRejectChanges',
        defaultMessage: 'Review changes',
    },
    validateOrRejectNewOrgUnit: {
        id: 'iaso.label.validateOrRejectNewOrgUnit',
        defaultMessage: 'Review new org. unit',
    },
    location: {
        id: 'iaso.label.location',
        defaultMessage: 'Location',
    },
    openingDate: {
        id: 'iaso.changeRequest.openingDate',
        defaultMessage: 'Opening date',
    },
    closingDate: {
        id: 'iaso.changeRequest.closingDate',
        defaultMessage: 'Closing date',
    },
    multiReferenceInstancesLabel: {
        id: 'iaso.orgUnits.MultiReferenceInstancesLabel',
        defaultMessage: 'Reference submissions',
    },
    label: {
        id: 'iaso.label.label',
        defaultMessage: 'Label',
    },
    newValue: {
        id: 'iaso.changeRequest.newValue',
        defaultMessage: 'New value',
    },
    oldValue: {
        id: 'iaso.changeRequest.oldValue',
        defaultMessage: 'Initial version',
    },
    value: {
        id: 'iaso.label.value',
        defaultMessage: 'Value',
    },
    reject: {
        id: 'iaso.changeRequest.reject',
        defaultMessage: 'Reject all',
    },
    selection: {
        id: 'iaso.label.selectionShort',
        defaultMessage: 'Sel.',
    },
    seeRejectedChanges: {
        id: 'iaso.changeRequest.seeRejectedChanges',
        defaultMessage: 'See rejected change(s)',
    },
    seeApprovedChanges: {
        id: 'iaso.changeRequest.seeApprovedChanges',
        defaultMessage: 'See approved change(s)',
    },
    addRejectionComment: {
        id: 'iaso.changeRequest.addRejectionComment',
        defaultMessage: 'Add comment for rejection',
    },
    addPartiallyApprovedComment: {
        id: 'iaso.changeRequest.addPartiallyApprovedComment',
        defaultMessage: 'Add comment for the partial approval',
    },
    confirmAcceptChangeRequest: {
        id: 'iaso.changeRequest.confirmAcceptChangeRequest',
        defaultMessage:
            'You are about to replace the original version (left) with the modified version (right).',
    },
    confirmOrgUnitCreationChangeRequest: {
        id: 'iaso.changeRequest.confirmOrgUnitCreationChangeRequest',
        defaultMessage:
            'You are about to create new Org Unit through change request.',
    },
    confirmMessage: {
        id: 'iaso.changeRequest.confirmMessage',
        defaultMessage: 'Do you confirm those changes?',
    },
    confirmOrgUnitCreationMessage: {
        id: 'iaso.changeRequest.confirmOrgUnitCreationMessage',
        defaultMessage: 'Do you confirm the creation?',
    },
    comment: {
        id: 'iaso.changeRequest.comment',
        defaultMessage: 'Comment',
    },
    createdDateFrom: {
        id: 'iaso.label.createdDateFrom',
        defaultMessage: 'Creation date from',
    },
    createdDateTo: {
        id: 'iaso.label.createdDateTo',
        defaultMessage: 'Creation date to',
    },
    close: {
        id: 'iaso.label.close',
        defaultMessage: 'Close',
    },
    forms: {
        defaultMessage: 'Forms',
        id: 'iaso.forms.title',
    },
    user: {
        id: 'iaso.label.user',
        defaultMessage: 'User',
    },
    dataSourceVersionsSynchronization: {
        id: 'iaso.label.dataSourceVersionsSynchronization',
        defaultMessage: 'Data Source Versions Synchronization',
    },
    userRoles: {
        defaultMessage: 'User roles',
        id: 'iaso.label.userRoles',
    },
    with: {
        id: 'iaso.label.with',
        defaultMessage: 'With',
    },
    without: {
        id: 'iaso.label.without',
        defaultMessage: 'Without',
    },
    newOrgUnit: {
        id: 'iaso.label.newOrgUnit',
        defaultMessage: 'New org. unit',
    },
    createOrgUnit: {
        id: 'iaso.label.createOrgUnit',
        defaultMessage: 'Create org. unit',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    viewDetails: {
        id: 'iaso.label.viewDetails',
        defaultMessage: 'View details',
    },
    paymentStatus: {
        id: 'iaso.label.paymentStatus',
        defaultMessage: 'Payment status',
    },
    accuracy: {
        id: 'iaso.label.accuracy',
        defaultMessage: 'Accuracy',
    },
    featureDisabled: {
        id: 'iaso.label.featureDisabled',
        defaultMessage: 'Feature temporarily disabled',
    },
    showAdvancedSettings: {
        id: 'iaso.form.label.showAdvancedSettings',
        defaultMessage: 'Show advanced settings',
    },
    hideAdvancedSettings: {
        id: 'iaso.form.label.hideAdvancedSettings',
        defaultMessage: 'Hide advanced settings',
    },
    source: {
        defaultMessage: 'Source',
        id: 'iaso.orgUnits.source',
    },
    sourceVersion: {
        id: 'iaso.form.label.sourceVersion',
        defaultMessage: 'Source version',
    },
    multiSelectionAction: {
        defaultMessage: 'Edit selected change requests',
        id: 'iaso.changeRequest.multiSelectionAction',
    },
    changeSelectedChangeRequests: {
        id: 'iaso.changeRequest.changeSelectedChangeRequests',
        defaultMessage: 'Edit {count} selected change requests.',
    },
    changeSelectedChangeRequestsWarning: {
        id: 'iaso.changeRequest.changeSelectedChangeRequestsWarning',
        defaultMessage:
            'Change requests that do not have the "new" status will be ignored.',
    },
    changeSelectedChangeRequestsLaunched: {
        id: 'iaso.snackBar.changeSelectedChangeRequestsLaunched',
        defaultMessage:
            'The modifications to the change requests will take a few moments to take effect.',
    },
    goToCurrentTask: {
        id: 'iaso.label.goToCurrentTask',
        defaultMessage: 'Launch and show task',
    },
    confirmMultiChange: {
        defaultMessage: 'Confirm mass changes ?',
        id: 'iaso.orgUnits.confirmMultiChange',
    },
    yes: {
        defaultMessage: 'Yes',
        id: 'iaso.label.yes',
    },
    no: {
        defaultMessage: 'No',
        id: 'iaso.label.no',
    },
    bulkChangeCount: {
        id: 'iaso.orgUnits.bulkChangeCount',
        defaultMessage: 'You are about to change {count} Org units',
    },
    searchByIds: {
        id: 'iaso.orgUnits.searchByIds',
        defaultMessage: 'Search by multiple IDs',
    },
    searchByIdsInfo: {
        id: 'iaso.orgUnits.searchByIdsInfo',
        defaultMessage:
            'Search by ID or multiple IDs at once, separated by a comma or a space. E.g. “132,654”',
    },
    bulkDeleteAction: {
        id: 'iaso.changeRequest.bulkDeleteAction',
        defaultMessage: 'Delete selected change requests?',
    },
    bulkRestoreAction: {
        id: 'iaso.changeRequest.bulkRestoreAction',
        defaultMessage: 'Restore selected change requests?',
    },
    bulkDeleteOrgUnitChangesCount: {
        id: 'iaso.changeRequest.deleteOrgUnitChangesCount',
        defaultMessage: 'Delete {count} change request(s)',
    },
    bulkRestoreOrgUnitChangesCount: {
        id: 'iaso.changeRequest.restoreOrgUnitChangesCount',
        defaultMessage: 'Restore {count} change request(s)',
    },
    bulkDeleteSuccess: {
        id: 'iaso.changeRequest.bulkDeleteSuccess',
        defaultMessage: 'Deleted successfully',
    },
    isSoftDeleted: {
        id: 'iaso.changeRequest.isSoftDeleted',
        defaultMessage: 'Show only deleted',
    },
});

export default MESSAGES;
