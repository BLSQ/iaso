import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Stock movements',
        id: 'iaso.stocks.title',
    },
    stockItem: {
        defaultMessage: 'Stock item',
        id: 'iaso.stocks.stockItem',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    org_unit: {
        defaultMessage: 'Org unit',
        id: 'iaso.instance.org_unit',
    },
    quantity: {
        id: 'iaso.label.quantity',
        defaultMessage: 'Quantity',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    delete: {
        id: 'iaso.stocks.delete',
        defaultMessage: 'Are you sure you want to delete this stock movement?',
    },
    deleteError: {
        id: 'iaso.snackBar.deleteTeamError',
        defaultMessage: 'An error occurred while deleting team',
    },
    deleteSuccess: {
        id: 'iaso.snackBar.delete_successful',
        defaultMessage: 'Deleted successfully',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'iaso.label.edit',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    addStockMovement: {
        id: 'iaso.stocks.addStockMovement',
        defaultMessage: 'Add a stock movement',
    },
    quantityError: {
        id: 'iaso.stocks.quantityError',
        defaultMessage: 'Quantity is required and needs to be a number',
    },
});

export default MESSAGES;
