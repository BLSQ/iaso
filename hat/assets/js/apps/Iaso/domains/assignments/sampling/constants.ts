import { orange, green, red, grey } from '@mui/material/colors';
import { alpha } from '@mui/material/styles';

export const StatusStyles = {
    RUNNING: {
        backgroundColor: alpha(orange[500], 0.1),
        border: `1px solid ${orange[500]}`,
        color: orange[500],
    },
    SUCCESS: {
        backgroundColor: alpha(green[500], 0.1),
        border: `1px solid ${green[500]}`,
        color: green[500],
    },
    ERRORED: {
        backgroundColor: alpha(red[500], 0.1),
        border: `1px solid ${red[500]}`,
        color: red[500],
    },
    KILLED: {
        backgroundColor: alpha(grey[500], 0.1),
        border: `1px solid ${grey[500]}`,
        color: grey[500],
    },
    SKIPPED: {
        backgroundColor: alpha(grey[500], 0.1),
        border: `1px solid ${grey[500]}`,
        color: grey[500],
    },
    EXPORTED: {
        backgroundColor: alpha(grey[500], 0.1),
        border: `1px solid ${grey[500]}`,
        color: grey[500],
    },
    QUEUED: {
        backgroundColor: alpha(grey[500], 0.1),
        border: `1px solid ${grey[500]}`,
        color: grey[500],
    },
};
