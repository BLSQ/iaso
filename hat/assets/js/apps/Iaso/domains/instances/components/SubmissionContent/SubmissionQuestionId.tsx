import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { SubmissionHighlightText } from './SubmissionHighlightText';

export const SubmissionQuestionId: FunctionComponent<{
    id: string;
    query: string;
}> = ({ id, query }) => (
    <Typography
        component="code"
        sx={{
            alignSelf: 'flex-start',
            fontFamily: 'monospace',
            fontSize: 11.5,
            color: 'text.secondary',
            backgroundColor: 'grey.100',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            px: 0.75,
            mt: 0.25,
        }}
    >
        <SubmissionHighlightText text={id} query={query} />
    </Typography>
);
