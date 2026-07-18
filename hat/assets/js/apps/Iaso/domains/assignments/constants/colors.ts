import { pink, grey } from '@mui/material/colors';

export const disabledColor = grey[400];
export const unSelectedColor = grey[600];
export const parentColor = pink[300];

/**
 * Colour of an org unit on the assignments map when neither its assignee nor its team has one.
 *
 * Deliberately a fixed grey rather than the theme's secondary colour: that is a per-deployment
 * branding value, so the "no colour yet" state used to change with the customer's theme and could
 * read as a real assignment colour. The pickable palette has no greys, so this stays unambiguous.
 */
export const defaultAssignmentColor = grey[500];
