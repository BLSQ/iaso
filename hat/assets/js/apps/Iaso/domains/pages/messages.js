import { defineMessages } from 'react-intl';

const MESSAGES = defineMessages({
    pages: {
        defaultMessage: 'Embedded links',
        id: 'iaso.pages.title',
    },
    name: {
        id: 'iaso.label.name',
        defaultMessage: 'Name',
    },
    address: {
        id: 'iaso.label.address',
        defaultMessage: 'Address',
    },
    updatedAt: {
        defaultMessage: 'Updated',
        id: 'iaso.label.updated_at',
    },
    actions: {
        defaultMessage: 'Action(s)',
        id: 'iaso.label.actions',
    },
    viewPage: {
        id: 'iaso.page.viewpages',
        defaultMessage:
            'View embedded link. {linebreak} New tab: ctrl/command + click',
    },
    edit: {
        id: 'iaso.label.edit',
        defaultMessage: 'Edit',
    },
    delete: {
        id: 'iaso.label.delete',
        defaultMessage: 'Delete',
    },
    create: {
        id: 'iaso.label.create',
        defaultMessage: 'Create',
    },
    slug: {
        id: 'iaso.label.slug',
        defaultMessage: 'Slug',
    },
    url: {
        id: 'iaso.label.url',
        defaultMessage: 'Url',
    },
    createPage: {
        id: 'iaso.pages.create',
        defaultMessage: 'Create an embedded link',
    },
    editPage: {
        id: 'iaso.pages.edit',
        defaultMessage: 'Edit an embedded link',
    },
    pageDialiogHelper: {
        id: 'iaso.pages.dialog.helper',
        defaultMessage: 'Enter embedded link information',
    },
    confirm: {
        id: 'iaso.label.confirm',
        defaultMessage: 'Confirm',
    },
    cancel: {
        id: 'iaso.label.cancel',
        defaultMessage: 'Cancel',
    },
    deleteDialiogTitle: {
        id: 'iaso.pages.dialog.delete.title',
        defaultMessage: 'Are you sure you want to delete this embedded link??',
    },
    deleteDialiogContent: {
        id: 'iaso.pages.dialog.delete.content',
        defaultMessage: 'This operation cannot be undone',
    },
    yes: {
        id: 'iaso.label.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'iaso.label.no',
        defaultMessage: 'No',
    },
    nameRequired: {
        id: 'iaso.pages.errors.name',
        defaultMessage: 'Name is required',
    },
    slugRequired: {
        id: 'iaso.pages.errors.slug',
        defaultMessage: 'Slug is required',
    },
    urlNotValid: {
        id: 'iaso.pages.errors.urlNotValid',
        defaultMessage: 'Url is not valid',
    },
    urlRequired: {
        id: 'iaso.pages.errors.url',
        defaultMessage: 'Url is required.',
    },
    contentRequired: {
        id: 'iaso.pages.errors.text',
        defaultMessage: 'Text content is required.',
    },
    type: {
        id: 'iaso.forms.type',
        defaultMessage: 'Type',
    },
    iframe: {
        id: 'iaso.label.iframe',
        defaultMessage: 'Iframe',
    },
    text: {
        id: 'iaso.label.text',
        defaultMessage: 'Text',
    },
    rawHtml: {
        id: 'iaso.label.rawHtml',
        defaultMessage: 'Raw html',
    },
    needsAuthentication: {
        id: 'iaso.label.needsAuthentication',
        defaultMessage: 'Authentification required',
    },
    users: {
        defaultMessage: 'Users',
        id: 'iaso.label.users',
    },
});

export default MESSAGES;
