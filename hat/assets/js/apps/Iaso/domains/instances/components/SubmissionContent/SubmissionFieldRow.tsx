import React, { FunctionComponent, ReactNode } from 'react';
import FunctionsIcon from '@mui/icons-material/Functions';
import { Box, Tooltip, Typography } from '@mui/material';
import { SubmissionValue } from './SubmissionValue';
import { SubmissionField } from './types';

/** Wrap every occurrence of `query` in `text` with a <mark>. */
export const HighlightedText: FunctionComponent<{
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

type Props = {
    field: SubmissionField;
    files: string[];
    showQuestionIds: boolean;
    query: string;
    /** Stack label above value and let the row span the full width */
    twoColumns: boolean;
    /** Drop the bottom divider when nothing is rendered directly below */
    hideBorder?: boolean;
};

const QuestionId: FunctionComponent<{ id: string; query: string }> = ({
    id,
    query,
}) => (
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
        <HighlightedText text={id} query={query} />
    </Typography>
);

export const SubmissionFieldRow: FunctionComponent<Props> = ({
    field,
    files,
    showQuestionIds,
    query,
    twoColumns,
    hideBorder = false,
}) => {
    // gps, photo and file values need the full width, so their label sits above
    const isBlock =
        field.kind === 'gps' || field.kind === 'photo' || field.kind === 'file';
    const stacked = isBlock || twoColumns;

    // while searching, reveal the id whenever it is what matched
    const idMatchesQuery = Boolean(
        query.trim() &&
        field.id.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const showId = showQuestionIds || idMatchesQuery;

    const label: ReactNode = (
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
                    <HighlightedText text={field.label} query={query} />
                </Typography>
            </Box>
            {showId && <QuestionId id={field.id} query={query} />}
        </Box>
    );

    return (
        <Box
            sx={theme => ({
                gridColumn: isBlock ? '1 / -1' : undefined,
                display: stacked ? 'flex' : 'grid',
                flexDirection: stacked ? 'column' : undefined,
                gridTemplateColumns: stacked
                    ? undefined
                    : 'minmax(0, 1.35fr) minmax(0, 1fr)',
                gap: stacked ? theme.spacing(0.75) : theme.spacing(3.5),
                alignItems: stacked ? 'stretch' : 'start',
                py: 1.6,
                px: twoColumns ? 0 : 2.75,
                borderBottom: hideBorder ? 0 : 1,
                borderColor: 'divider',
                '&:hover': twoColumns
                    ? undefined
                    : { backgroundColor: 'action.hover' },
            })}
        >
            {label}
            <Box
                sx={{
                    minWidth: 0,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0.75,
                    justifyContent: stacked ? 'flex-start' : 'flex-end',
                    textAlign: stacked ? 'left' : 'right',
                    fontSize: 14,
                }}
                title={
                    typeof field.rawValue === 'string'
                        ? field.rawValue
                        : undefined
                }
            >
                <SubmissionValue field={field} files={files} />
            </Box>
        </Box>
    );
};
