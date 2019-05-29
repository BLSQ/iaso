import { defineMessages } from 'react-intl';
import L from 'leaflet';

const MESSAGES = defineMessages({
    cancel: {
        defaultMessage: 'Annuler',
        id: 'map.draw.label.cancel',
    },
    finish: {
        defaultMessage: 'Arrêter',
        id: 'map.draw.label.finish',
    },
    undo: {
        defaultMessage: 'Revenir en arrière',
        id: 'map.draw.label.undo',
    },
    polygon: {
        defaultMessage: 'Dessiner un polygône',
        id: 'map.draw.label.polygon',
    },
    polygonTooltipStart: {
        defaultMessage: 'Cliquez pour commencer à dessiner une forme',
        id: 'map.draw.label.polygonTooltipStart',
    },
    polygonTooltipCont: {
        defaultMessage: 'Cliquez pour continuer à dessiner la forme',
        id: 'map.draw.label.polygonTooltipCont',
    },
    polygonTooltipEnd: {
        defaultMessage: 'Cliquez sur le premier point pour finir la frome',
        id: 'map.draw.label.polygonTooltipEnd',
    },
    rectangle: {
        defaultMessage: 'Dessiner un rectangle',
        id: 'map.draw.label.rectangle',
    },
    rectangleTooltip: {
        defaultMessage: 'Cliquez et bougez pour dessiner un rectangle ',
        id: 'map.draw.label.rectangleTooltip',
    },
    circle: {
        defaultMessage: 'Dessiner un cercle',
        id: 'map.draw.label.circle',
    },
    circleTooltip: {
        defaultMessage: 'Cliquez et bougez pour dessiner un cercle ',
        id: 'map.draw.label.circleTooltip',
    },
    save: {
        defaultMessage: 'Sauver',
        id: 'map.draw.label.save',
    },
    clearAll: {
        defaultMessage: 'Tout effacer',
        id: 'map.draw.label.clearAll',
    },
    edit: {
        defaultMessage: 'Editer',
        id: 'map.draw.label.edit',
    },
    editDisabled: {
        defaultMessage: 'Rien à éditer',
        id: 'map.draw.label.editDisabled',
    },
    clear: {
        defaultMessage: 'Effacer',
        id: 'map.draw.label.clear',
    },
    removeDisabled: {
        defaultMessage: 'Rien à effacer',
        id: 'map.draw.label.removeDisabled',
    },
    editTooltip1: {
        defaultMessage: 'Cliquez pour modifier les formes',
        id: 'map.draw.label.editTooltip1',
    },
    editTooltip2: {
        defaultMessage: 'Cliquez sur annuler pour effacer les changements',
        id: 'map.draw.label.editTooltip2',
    },
    removeTooltip: {
        defaultMessage: 'Cliquez sur une forme pour l\'effacer',
        id: 'map.draw.label.removeTooltip',
    },
});

const setDrawMessages = (formatMessage) => {
    L.drawLocal = {
        draw: {
            toolbar: {
                actions: {
                    title: formatMessage(MESSAGES.cancel),
                    text: formatMessage(MESSAGES.cancel),
                },
                finish: {
                    title: formatMessage(MESSAGES.finish),
                    text: formatMessage(MESSAGES.finish),
                },
                undo: {
                    title: formatMessage(MESSAGES.undo),
                    text: formatMessage(MESSAGES.undo),
                },
                buttons: {
                    polygon: formatMessage(MESSAGES.polygon),
                    rectangle: formatMessage(MESSAGES.rectangle),
                    circle: formatMessage(MESSAGES.circle),
                },
            },
            handlers: {
                circle: {
                    tooltip: {
                        start: formatMessage(MESSAGES.circleTooltip),
                    },
                    radius: 'RADIUS',
                },
                circlemarker: {
                    tooltip: {
                        start: '',
                    },
                },
                marker: {
                    tooltip: {
                        start: '',
                    },
                },
                polygon: {
                    tooltip: {
                        start: formatMessage(MESSAGES.polygonTooltipStart),
                        cont: formatMessage(MESSAGES.polygonTooltipCont),
                        end: formatMessage(MESSAGES.polygonTooltipEnd),
                    },
                },
                polyline: {
                    error: '',
                    tooltip: {
                        start: '',
                        cont: '',
                        end: '',
                    },
                },
                rectangle: {
                    tooltip: {
                        start: formatMessage(MESSAGES.circleTooltip),
                    },
                },
                simpleshape: {
                    tooltip: {
                        end: '',
                    },
                },
            },
        },
        edit: {
            toolbar: {
                actions: {
                    save: {
                        title: formatMessage(MESSAGES.save),
                        text: formatMessage(MESSAGES.save),
                    },
                    cancel: {
                        title: formatMessage(MESSAGES.cancel),
                        text: formatMessage(MESSAGES.cancel),
                    },
                    clearAll: {
                        title: formatMessage(MESSAGES.clearAll),
                        text: formatMessage(MESSAGES.clearAll),
                    },
                },
                buttons: {
                    edit: formatMessage(MESSAGES.edit),
                    editDisabled: formatMessage(MESSAGES.editDisabled),
                    remove: formatMessage(MESSAGES.clear),
                    removeDisabled: formatMessage(MESSAGES.removeDisabled),
                },
            },
            handlers: {
                edit: {
                    tooltip: {
                        text: formatMessage(MESSAGES.editTooltip1),
                        subtext: formatMessage(MESSAGES.editTooltip2),
                    },
                },
                remove: {
                    tooltip: {
                        text: formatMessage(MESSAGES.removeTooltip),
                    },
                },
            },
        },
    };
};

export default setDrawMessages;
