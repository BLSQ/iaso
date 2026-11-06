import React from 'react';
import MuiAccordion from '@mui/material/Accordion/Accordion';
import type { AccordionProps } from '@mui/material/Accordion/Accordion';
import styled from '@mui/material/styles/styled';
export const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&::before': {
        display: 'none',
    },
}));
