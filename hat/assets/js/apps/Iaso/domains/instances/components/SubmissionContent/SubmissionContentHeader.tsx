import React, { FunctionComponent } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RepeatIcon from '@mui/icons-material/Repeat';
import { Box, ButtonBase, Chip, Theme, Typography, alpha } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { numericValues } from 'Iaso/domains/instances/utils/intl';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { SubmissionSection } from './types';
import { getSectionFields, getSectionIndent } from './useSubmissionSections';

const styles = {
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
    clickableRoot: {
        width: '100%',
        justifyContent: 'flex-start',
        textAlign: 'left',
        '&:hover': { backgroundColor: 'grey.200' },
        '&.Mui-focusVisible': { backgroundColor: 'grey.200' },
    },
    trailing: {
        ml: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: 1.4,
    },
    toggleIcon: {
        color: 'primary.main',
        transition: 'transform 150ms',
    },
    toggleIconCollapsed: {
        transform: 'rotate(-90deg)',
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
    repeatCount: {
        color: 'primary.main',
        backgroundColor: (theme: Theme) =>
            alpha(theme.palette.primary.main, 0.08),
        borderColor: (theme: Theme) => alpha(theme.palette.primary.main, 0.3),
        '& .MuiChip-icon': {
            fontSize: 14,
            color: 'primary.main',
            ml: 0.75,
            mr: -0.25,
        },
    },
} satisfies SxStyles;

export const SubmissionContentHeader: FunctionComponent<{
    section: SubmissionSection;
    isSearching: boolean;
    showQuestionIds: boolean;
    expanded?: boolean;
    onToggle?: () => void;
}> = ({ section, isSearching, showQuestionIds, expanded = true, onToggle }) => {
    const { formatMessage } = useSafeIntl();
    const isRepeat = section.repeatCount !== undefined;
    const fieldCount = getSectionFields(section).length;
    const countLabel = isRepeat
        ? formatMessage(
              MESSAGES.repeatedCount,
              numericValues({ count: section.repeatCount ?? 0 }),
          )
        : formatMessage(
              isSearching ? MESSAGES.matchingFieldsCount : MESSAGES.fieldsCount,
              numericValues({
                  count: fieldCount,
                  total: section.totalFields ?? fieldCount,
              }),
          );
    const rootSx = {
        ...styles.root,
        pl: 2.75 + getSectionIndent(section.depth),
        ...(onToggle && styles.clickableRoot),
    };
    const content = (
        <>
            <Box sx={styles.sectionIndicator} />
            <Typography variant="subtitle2" sx={styles.sectionLabel}>
                {section.label}
            </Typography>
            <Chip
                size="small"
                icon={isRepeat ? <RepeatIcon /> : undefined}
                sx={{
                    ...styles.sectionCount,
                    ...(isRepeat && styles.repeatCount),
                }}
                label={countLabel}
            />
            <Box sx={styles.trailing}>
                {showQuestionIds && section.id && (
                    <Typography component="code" sx={styles.sectionId}>
                        {section.id}
                    </Typography>
                )}
                {onToggle && (
                    <ExpandMoreIcon
                        fontSize="small"
                        sx={{
                            ...styles.toggleIcon,
                            ...(!expanded && styles.toggleIconCollapsed),
                        }}
                    />
                )}
            </Box>
        </>
    );

    if (!onToggle) return <Box sx={rootSx}>{content}</Box>;

    // a div rather than a native button: the Chip inside renders a div,
    // which is invalid content for <button>
    return (
        <ButtonBase
            component="div"
            onClick={onToggle}
            aria-expanded={expanded}
            sx={rootSx}
        >
            {content}
        </ButtonBase>
    );
};
