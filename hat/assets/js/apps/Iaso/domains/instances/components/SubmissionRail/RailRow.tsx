import React, { FunctionComponent, ReactNode } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
    AccordionDetails,
    AccordionSummary,
    Box,
    Typography,
} from '@mui/material';
import { Accordion } from 'Iaso/components/Accordion/Accordion';
import { SxStyles } from 'Iaso/types/general';

export type RailRowTone = 'muted' | 'info' | 'success' | 'warning';

const toneStyles: Record<
    RailRowTone,
    { backgroundColor: string; color: string }
> = {
    muted: { backgroundColor: 'grey.100', color: 'text.disabled' },
    info: { backgroundColor: 'action.hover', color: 'primary.main' },
    success: { backgroundColor: 'success.light', color: 'success.dark' },
    warning: { backgroundColor: 'warning.light', color: 'warning.dark' },
};

const styles: SxStyles = {
    root: {
        border: 0,
        '&:not(:last-of-type)': {
            borderBottom: 1,
            borderColor: 'divider',
        },
    },
    accordionSummary: {
        px: 2,
        minWidth: 0,
        // flex items default to min-width: auto and won't shrink below
        // their text, which blocks text-overflow: ellipsis on the state
        '& .MuiAccordionSummary-content': {
            my: 1.25,
            minWidth: 0,
            overflow: 'hidden',
        },
    },
    accordionSummaryContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 1,
        display: 'grid',
        placeItems: 'center',
        flex: '0 0 auto',
    },
    label: {
        flex: '0 0 auto',
        fontSize: 14,
        fontWeight: 500,
    },
    state: {
        fontSize: 13,
        fontWeight: 500,
        // leftover space, not content width — otherwise the row grows instead of truncating
        flex: '1 1 0%',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    accordionDetails: {
        px: 2,
        pt: 0,
        pb: 2,
    },
};

type Props = {
    icon: ReactNode;
    label: string;
    /** Short summary shown on the collapsed row, e.g. "Unlocked" or "3 files" */
    state?: string;
    tone?: RailRowTone;
    defaultExpanded?: boolean;
    children: ReactNode;
};

/**
 * One collapsible row of the submission detail rail: an icon, a label, and a
 * short state summary that lets the user skip the row without opening it.
 */
export const RailRow: FunctionComponent<Props> = ({
    icon,
    label,
    state,
    tone = 'muted',
    defaultExpanded = false,
    children,
}) => {
    const tones = toneStyles[tone];
    return (
        <Accordion
            defaultExpanded={defaultExpanded}
            // the shared Accordion draws a full border per row; inside the rail
            // Paper we only want a divider between rows
            sx={styles.root}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={styles.accordionSummary}
            >
                <Box sx={styles.accordionSummaryContainer}>
                    <Box sx={{ ...styles.iconContainer, ...tones }}>{icon}</Box>
                    <Typography sx={styles.label}>{label}</Typography>
                    {state && (
                        <Typography
                            title={state}
                            sx={{ ...styles.state, color: tones.color }}
                        >
                            {state}
                        </Typography>
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={styles.accordionDetails}>
                {children}
            </AccordionDetails>
        </Accordion>
    );
};
