import React, { FunctionComponent, ReactElement, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';

const styles: SxStyles = {
    // one line by default so the cards keep their height from a question to the next
    row: {
        display: 'flex',
        flexWrap: 'nowrap',
        gap: 0.75,
        minHeight: 24,
        overflow: 'hidden',
    },
    expandedRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0.75,
        minHeight: 24,
    },
    chip: {
        minWidth: 0,
    },
    more: {
        flexShrink: 0,
    },
};

export type ChipItem = {
    key: string;
    label: string;
    title?: string;
    icon?: ReactElement;
};

type Props = {
    items: ChipItem[];
    maxVisible: number;
};

export const ChipsRow: FunctionComponent<Props> = ({ items, maxVisible }) => {
    const { formatMessage } = useSafeIntl();
    const [expanded, setExpanded] = useState(false);
    if (items.length === 0) {
        return <Typography>{textPlaceholder}</Typography>;
    }
    const hiddenCount = items.length - maxVisible;
    const visibleItems = expanded ? items : items.slice(0, maxVisible);
    return (
        <Box sx={expanded ? styles.expandedRow : styles.row}>
            {visibleItems.map(item => (
                <Chip
                    key={item.key}
                    size="small"
                    variant="outlined"
                    icon={item.icon}
                    label={item.label}
                    title={item.title}
                    sx={styles.chip}
                />
            ))}
            {hiddenCount > 0 && (
                <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={
                        expanded
                            ? formatMessage(MESSAGES.showLess)
                            : `+${hiddenCount}`
                    }
                    title={
                        expanded
                            ? undefined
                            : items
                                  .slice(maxVisible)
                                  .map(item => item.label)
                                  .join('\n')
                    }
                    aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                    sx={styles.more}
                />
            )}
        </Box>
    );
};
