import { defineMessages } from 'react-intl';

export const MESSAGES = defineMessages({
    title: {
        id: 'iaso.workInProgress.title',
        defaultMessage: 'This page is still under construction',
    },
    description: {
        id: 'iaso.workInProgress.description',
        defaultMessage:
            'The crew is still laying the last bricks on this page. Grab a coffee, it will be ready soon.',
    },
    plannedRelease: {
        id: 'iaso.workInProgress.plannedRelease',
        defaultMessage: 'Planned release: {release}',
    },
    goBack: {
        id: 'iaso.workInProgress.goBack',
        defaultMessage: 'Go back',
    },
});
