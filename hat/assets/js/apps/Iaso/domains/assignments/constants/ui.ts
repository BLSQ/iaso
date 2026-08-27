import { SxStyles } from 'Iaso/types/general';

export const defaultHeight = '75vh';

export const ASSIGNMENTS_TARGET_CLASS = 'assignments-target';

export const ASSIGNMENTS_PARENT_CLASS = 'assignments-parent';

export const ASSIGNMENTS_ROOT_CLASS = 'assignments-root';

const assignmentsMapCursorStyles = (className: string) => ({
    [`&.assignments-map--cannot-assign path.leaflet-interactive.${className}`]:
        {
            cursor: 'not-allowed !important',
        },
    [`&.assignments-map--can-assign path.leaflet-interactive.${className}`]: {
        cursor: 'pointer !important',
    },
});

export const assignmentsMapStyles: SxStyles = {
    ...assignmentsMapCursorStyles(ASSIGNMENTS_TARGET_CLASS),
    ...assignmentsMapCursorStyles(ASSIGNMENTS_PARENT_CLASS),
    [`path.leaflet-interactive.${ASSIGNMENTS_ROOT_CLASS}`]: {
        cursor: 'default !important',
    },
};
