import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

/** Wrap the first occurrence of `query` in `text` with a <mark>. */
export const SubmissionHighlightText: FunctionComponent<{
    text: string;
    query: string;
}> = ({ text, query }) => {
    const trimmed = query.trim();
    if (!trimmed) return <>{text}</>;
    const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
    if (index < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, index)}
            <Box
                component="mark"
                sx={{
                    backgroundColor: 'warning.light',
                    color: 'inherit',
                    borderRadius: 0.5,
                    px: '1px',
                }}
            >
                {text.slice(index, index + trimmed.length)}
            </Box>
            {text.slice(index + trimmed.length)}
        </>
    );
};
