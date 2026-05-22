import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    createBudgetProcessTitle: {
        id: 'iaso.polio.budget.title.create_budget',
        defaultMessage: 'Plan a new budget process',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    labelCampaign: {
        id: 'iaso.polio.budget.label.campaign',
        defaultMessage: 'Campaign',
    },
    labelCountry: {
        id: 'iaso.polio.budget.label.country',
        defaultMessage: 'Country',
    },
    labelRound: {
        id: 'iaso.polio.budget.label.round',
        defaultMessage: 'Round',
    },
    messageCreateSuccess: {
        id: 'iaso.polio.budget.message.CreateSuccess',
        defaultMessage: 'Budget process successfully created',
    },
    messageEditSuccess: {
        id: 'iaso.polio.budget.message.EditSuccess',
        defaultMessage: 'Budget process successfully edited',
    },
    messageDeleteSuccess: {
        id: 'iaso.polio.budget.message.DeleteSuccess',
        defaultMessage: 'Budget process successfully deleted',
    },
    modalDeleteYes: {
        id: 'iaso.polio.modal.yes',
        defaultMessage: 'Yes',
    },
    modalDeleteNo: {
        id: 'iaso.polio.modal.no',
        defaultMessage: 'No',
    },
    modalConfirmDeleteBudgetProcess: {
        id: 'iaso.polio.budget_process.modal.confirmDelete',
        defaultMessage: 'Are you sure you want to delete this budget process?',
    },
    modalEditBudgetProcess: {
        id: 'iaso.polio.budget_process.modal.edit',
        defaultMessage: 'Edit budget process',
    },
    modalWriteCancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    modalWriteConfirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    requiredField: {
        id: 'iaso.forms.error.fieldRequired',
        defaultMessage: 'This field is required',
    },
    requiredPositiveInteger: {
        id: 'iaso.forms.error.positiveInteger',
        defaultMessage: 'Please use a positive integer',
    },
    requiredUuid: {
        id: 'iaso.forms.error.requiredUuid',
        defaultMessage: 'Please use an UUID',
    },
    budgetRequest: {
        id: 'iaso.polio.form.label.budgetRequest',
        defaultMessage: 'Budget request',
    },
    RRTReview: {
        id: 'iaso.polio.form.label.RRTReview',
        defaultMessage: 'RRT review',
    },
    ORPGReview: {
        id: 'iaso.polio.form.label.ORPGReview',
        defaultMessage: 'ORPG review',
    },
    approval: {
        id: 'iaso.polio.form.label.approval',
        defaultMessage: 'Approval',
    },
    ra_completed: {
        id: 'iaso.polio.form.label.ra_completed',
        defaultMessage: 'Risk Assessment completed',
    },
    who_sent_budget: {
        id: 'iaso.polio.form.label.who_sent_budget',
        defaultMessage: 'WHO CO sent budget',
    },
    unicef_sent_budget: {
        id: 'iaso.polio.form.label.unicef_sent_budget',
        defaultMessage: 'UNICEF CO sent budget',
    },
    gpei_consolidated_budgets: {
        id: 'iaso.polio.form.label.gpei_consolidated_budgets',
        defaultMessage: 'Consolidation by GPEI coordinator',
    },
    submitted_to_rrt: {
        id: 'iaso.polio.form.label.submitted_to_rrt',
        defaultMessage: 'Submitted to RRT',
    },
    feedback_sent_to_gpei: {
        id: 'iaso.polio.form.label.feedback_sent_to_gpei',
        defaultMessage: 'Feedback sent to GPEI coordinator',
    },
    re_submitted_to_rrt: {
        id: 'iaso.polio.form.label.re_submitted_to_rrt',
        defaultMessage: 'Resubmitted to RRT',
    },
    submitted_to_orpg_operations1: {
        id: 'iaso.polio.form.label.submitted_to_orpg_operations1',
        defaultMessage: 'Submitted to ORPG Ops',
    },
    feedback_sent_to_rrt1: {
        id: 'iaso.polio.form.label.feedback_sent_to_rrt1',
        defaultMessage: 'Feedback sent to RRT',
    },
    re_submitted_to_orpg_operations1: {
        id: 'iaso.polio.form.label.re_submitted_to_orpg_operations1',
        defaultMessage: 'Resubmitted to ORPG Operations',
    },
    submitted_to_orpg_wider: {
        id: 'iaso.polio.form.label.submitted_to_orpg_wider',
        defaultMessage: 'Submitted to ORPG wider',
    },
    re_submitted_to_orpg_operations2: {
        id: 'iaso.polio.form.label.re_submitted_to_orpg_operations2',
        defaultMessage: 'Resubmitted to ORPG Operations (ORPG wider)',
    },
    feedback_sent_to_rrt2: {
        id: 'iaso.polio.form.label.feedback_sent_to_rrt2',
        defaultMessage: 'Feedback sent to RRT (ORPG wider)',
    },
    submitted_to_orpg_operations2: {
        id: 'iaso.polio.form.label.submitted_to_orpg_operations2',
        defaultMessage: 'Submitted to ORPG Operations (ORPG wider)',
    },
    submitted_for_approval: {
        id: 'iaso.polio.form.label.submitted_for_approval',
        defaultMessage: 'Submitted for approval',
    },
    feedback_sent_to_orpg_operations_unicef: {
        id: 'iaso.polio.form.label.feedback_sent_to_orpg_operations_unicef',
        defaultMessage: 'Feedback requested by UNICEF',
    },
    feedback_sent_to_orpg_operations_who: {
        id: 'iaso.polio.form.label.feedback_sent_to_orpg_operations_who',
        defaultMessage: 'Feedback requested by WHO',
    },
    approved_by_who: {
        id: 'iaso.polio.form.label.approved_by_who',
        defaultMessage: 'Approved by WHO',
    },
    approved_by_unicef: {
        id: 'iaso.polio.form.label.approved_by_unicef',
        defaultMessage: 'Approved by UNICEF',
    },
    approved: {
        id: 'iaso.polio.label.approved',
        defaultMessage: 'Approved',
    },
    approval_confirmed: {
        id: 'iaso.polio.form.label.approval_confirmed',
        defaultMessage: 'Approval confirmed',
    },
    status: {
        id: 'iaso.polio.table.label.status',
        defaultMessage: 'Status',
    },
    budgetApproval: {
        id: 'iaso.polio.budget.budgetApproval',
        defaultMessage: 'Budget approval',
    },
    fundsRelease: {
        id: 'iaso.polio.budget.fundsRelease',
        defaultMessage: 'Funds release',
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
    district_count: {
        id: 'iaso.polio.form.label.districtCount',
        defaultMessage: 'District Count',
    },
    noRegretFund: {
        id: 'iaso.polio.form.label.noRegretFund',
        defaultMessage: 'No Regret Fund',
    },
    cost: {
        id: 'iaso.polio.form.label.cost',
        defaultMessage: 'Cost',
    },
    costPerChildRound: {
        id: 'iaso.polio.form.label.costPerChildRound',
        defaultMessage: 'Cost/Child',
    },
    costPerChild: {
        id: 'iaso.polio.form.label.costPerChild',
        defaultMessage: 'Cost per child',
    },
    costPerChildTotal: {
        id: 'iaso.polio.form.label.costPerChildTotal',
        defaultMessage: 'Cost/Child Total',
    },
    roundNumber: {
        id: 'iaso.polio.label.round.number',
        defaultMessage: 'Round number',
    },
    targetPopulation: {
        id: 'iaso.polio.label.targetPopulation',
        defaultMessage: 'Target population',
    },
    targetPopulationMessage: {
        id: 'iaso.polio.label.targetPopulationMessage',
        defaultMessage:
            'Target population can be edited in "Campaigns" > "Rounds" tab',
    },
    invalidDate: {
        id: 'iaso.polio.form.invalidDate',
        defaultMessage: 'Date is invalid',
    },
    noRounds: {
        id: 'iaso.polio.form.label.noRounds',
        defaultMessage: 'No rounds selected',
    },
});

export default MESSAGES;
