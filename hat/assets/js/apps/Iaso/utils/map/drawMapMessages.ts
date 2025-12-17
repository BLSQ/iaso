import { defineMessages } from 'react-intl';
import L from 'leaflet';

const MESSAGES = defineMessages({
    cancel: {
        defaultMessage: 'Cancel',
        id: 'map.draw.label.cancel',
    },
    finish: {
        defaultMessage: 'Stop',
        id: 'map.draw.label.finish',
    },
    undo: {
        defaultMessage: 'Back',
        id: 'map.draw.label.undo',
    },
    polygon: {
        defaultMessage: 'Draw a polygon',
        id: 'map.draw.label.polygon',
    },
    polygonTooltipStart: {
        defaultMessage: 'Click here to start draw a shape',
        id: 'map.draw.label.polygonTooltipStart',
    },
    polygonTooltipCont: {
        defaultMessage: 'Click to continue draw a shape',
        id: 'map.draw.label.polygonTooltipCont',
    },
    polygonTooltipEnd: {
        defaultMessage: 'Click on the first point to finish the shape',
        id: 'map.draw.label.polygonTooltipEnd',
    },
    rectangle: {
        defaultMessage: 'Draw a rectangle',
        id: 'map.draw.label.rectangle',
    },
    rectangleTooltip: {
        defaultMessage: 'Click and move to draw a rectangle',
        id: 'map.draw.label.rectangleTooltip',
    },
    circle: {
        defaultMessage: 'Draw a circle',
        id: 'map.draw.label.circle',
    },
    circleTooltip: {
        defaultMessage: 'Click and move to draw a circle ',
        id: 'map.draw.label.circleTooltip',
    },
    save: {
        defaultMessage: 'Save',
        id: 'map.draw.label.save',
    },
    clearAll: {
        defaultMessage: 'Clear all',
        id: 'map.draw.label.clearAll',
    },
    edit: {
        defaultMessage: 'Edit',
        id: 'map.draw.label.edit',
    },
    editDisabled: {
        defaultMessage: 'Nothing to edit',
        id: 'map.draw.label.editDisabled',
    },
    clear: {
        defaultMessage: 'Clear',
        id: 'map.draw.label.clear',
    },
    removeDisabled: {
        defaultMessage: 'Nothing to clear',
        id: 'map.draw.label.removeDisabled',
    },
    editTooltip1: {
        defaultMessage: 'Click to edit shapes',
        id: 'map.draw.label.editTooltip1',
    },
    editTooltip2: {
        defaultMessage: 'Click on stop to validate changes',
        id: 'map.draw.label.editTooltip2',
    },
    removeTooltip: {
        defaultMessage: 'Click on a shape to delete it',
        id: 'map.draw.label.removeTooltip',
    },
    radius: {
        defaultMessage: 'Radius',
        id: 'map.draw.label.radius',
    },
});

const setDrawMessages = formatMessage => {
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
                    radius: formatMessage(MESSAGES.radius),
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
                        start: formatMessage(MESSAGES.rectangleTooltip),
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
