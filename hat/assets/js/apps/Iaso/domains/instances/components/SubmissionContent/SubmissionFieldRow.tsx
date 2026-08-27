import React, { FunctionComponent } from 'react';
import { Box, Theme } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { SubmissionValue } from '../SubmissionValue';
import { SubmissionFieldRowLabel } from './SubmissionFieldRowLabel';
import { SubmissionField } from './types';
import { spansFullWidth } from './useSubmissionSections';

const getStyles = (
    spanFull: boolean,
    twoColumns: boolean,
    stacked: boolean,
    hideBorder: boolean,
): SxStyles => ({
    root: {
        gridColumn: spanFull ? '1 / -1' : undefined,
        display: stacked ? 'flex' : 'grid',
        flexDirection: stacked ? 'column' : undefined,
        gridTemplateColumns: stacked
            ? undefined
            : 'minmax(0, 1.35fr) minmax(0, 1fr)',
        gap: (theme: Theme) =>
            stacked ? theme.spacing(0.75) : theme.spacing(3.5),
        alignItems: stacked ? 'stretch' : 'start',
        py: 1.6,
        px: twoColumns ? 0 : 2.75,
        borderBottom: hideBorder ? 0 : 1,
        borderColor: 'divider',
        '&:hover': twoColumns ? undefined : { backgroundColor: 'action.hover' },
    },
    value: {
        minWidth: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        justifyContent: stacked ? 'flex-start' : 'flex-end',
        textAlign: stacked ? 'left' : 'right',
        fontSize: 14,
    },
});
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

export const SubmissionFieldRow: FunctionComponent<Props> = ({
    field,
    files,
    showQuestionIds,
    query,
    twoColumns,
    hideBorder = false,
}) => {
    // gps, photo and file values are tall/wide, so their label sits above
    const isBlock =
        field.kind === 'gps' || field.kind === 'photo' || field.kind === 'file';
    // only the map genuinely needs the full panel width; capped images and
    // files flow within the two-column grid like any other field
    const spanFull = spansFullWidth(field.kind);
    const stacked = isBlock || twoColumns;

    // while searching, reveal the id whenever it is what matched
    const idMatchesQuery = Boolean(
        query.trim() &&
        field.id.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const showId = showQuestionIds || idMatchesQuery;
    const styles = getStyles(spanFull, twoColumns, stacked, hideBorder);
    return (
        <Box sx={styles.root}>
            <SubmissionFieldRowLabel
                field={field}
                query={query}
                showId={showId}
            />
            <Box
                sx={styles.value}
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
