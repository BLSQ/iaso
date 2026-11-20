import React, { FunctionComponent } from 'react';
import FunctionsIcon from '@mui/icons-material/Functions';
import Box from '@mui/material/Box/Box';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import Typography from '@mui/material/Typography/Typography';
import { SubmissionHighlightText } from './SubmissionHighlightText';
import { SubmissionQuestionId } from './SubmissionQuestionId';
import { SubmissionField } from './types';

type Props = {
    field: SubmissionField;
    query: string;
    showId: boolean;
};

export const SubmissionFieldRowLabel: FunctionComponent<Props> = ({
    field,
    query,
    showId,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.4,
                minWidth: 0,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                {field.kind === 'calculated' && (
                    <Tooltip
                        placement="right-start"
                        title={field.tooltip ?? ''}
                        disableHoverListener={!field.tooltip}
                    >
                        <FunctionsIcon color="disabled" fontSize="small" />
                    </Tooltip>
                )}
                <Typography
                    component="span"
                    sx={{
                        fontSize: 14,
                        lineHeight: 1.4,
                        wordBreak: 'break-word',
                        color: field.empty ? 'text.secondary' : 'text.primary',
                    }}
                >
                    <SubmissionHighlightText text={field.label} query={query} />
                </Typography>
            </Box>
            {showId && <SubmissionQuestionId id={field.id} query={query} />}
        </Box>
    );
};
