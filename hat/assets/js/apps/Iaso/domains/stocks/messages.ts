import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    title: {
        defaultMessage: 'Stock movements',
        id: 'iaso.stocks.title',
    },
    org_unit: {
        defaultMessage: 'Org unit',
        id: 'iaso.instance.org_unit',
    },
    stockItem: {
        defaultMessage: 'Stock item',
        id: 'iaso.stocks.stockItem',
    },
    quantity: {
        id: 'iaso.label.quantity',
        defaultMessage: 'Quantity',
    },
    created_at: {
        id: 'iaso.forms.created_at',
        defaultMessage: 'Created',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    save: {
        id: 'iaso.label.save',
        defaultMessage: 'Save',
    },
    delete: {
        id: 'iaso.stocks.delete',
        defaultMessage: 'Are you sure you want to delete this stock movement?',
    },
    addStockMovement: {
        id: 'iaso.stocks.addStockMovement',
        defaultMessage: 'Add a stock movement',
    },
    quantityError: {
        id: 'iaso.stocks.quantityError',
        defaultMessage: 'Quantity is required and needs to be a number',
    },
    required: {
        id: 'iaso.polio.form.fieldRequired',
        defaultMessage: 'This field is required',
    },
    negative_quantity: {
        id: 'iaso.stocks.negative_quantity',
        defaultMessage: 'Cannot have a negative total stock',
    },
    zero_quantity: {
        id: 'iaso.stocks.zero_quantity',
        defaultMessage: 'Quantity cannot be zero',
    },
});

export default MESSAGES;
