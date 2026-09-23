import React, { FunctionComponent } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { FilteredSection } from './useSubmissionSections';

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
        px: 2.75,
        py: 1.5,
        backgroundColor: 'grey.100',
        borderTop: 1,
        borderBottom: 1,
        borderColor: 'divider',
    },
    sectionIndicator: {
        width: 4,
        height: 18,
        borderRadius: 1,
        backgroundColor: 'primary.main',
        flex: '0 0 auto',
    },
    sectionLabel: {
        color: 'primary.main',
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
    },
    sectionId: {
        ml: 'auto',
        fontFamily: 'monospace',
        fontSize: 11.5,
        color: 'text.disabled',
    },
    sectionCount: {
        height: 20,
        fontSize: 11.5,
        fontWeight: 500,
        color: 'text.secondary',
        backgroundColor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        '& .MuiChip-label': { px: 1 },
    },
};

export const SubmissionContentHeader: FunctionComponent<{
    section: FilteredSection;
    isSearching: boolean;
    showQuestionIds: boolean;
}> = ({ section, isSearching, showQuestionIds }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={{ ...styles.root, pl: 2.75 + section.depth * 2 }}>
            <Box sx={styles.sectionIndicator} />
            <Typography variant="subtitle2" sx={styles.sectionLabel}>
                {section.label}
            </Typography>
            <Chip
                size="small"
                sx={styles.sectionCount}
                label={
                    isSearching
                        ? formatMessage(MESSAGES.matchingFieldsCount, {
                              count: `${section.fields.length}`,
                              total: `${section.totalFields}`,
                          })
                        : formatMessage(
                              MESSAGES.fieldsCount,
                              numericValues({ count: section.fields.length }),
                          )
                }
            />
            {showQuestionIds && section.id && (
                <Typography component="code" sx={styles.sectionId}>
                    {section.id}
                </Typography>
            )}
        </Box>
    );
};
