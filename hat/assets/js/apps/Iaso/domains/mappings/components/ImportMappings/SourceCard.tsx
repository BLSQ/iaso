import React, { FunctionComponent, KeyboardEvent } from 'react';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { Box, Chip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';
import { ImportSource } from '../../types';

type Props = {
    source: ImportSource;
    selected: boolean;
    onSelect: () => void;
};

const card = {
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    p: 1.5,
    mb: 1,
    cursor: 'pointer',
    border: 1,
    borderRadius: 1,
    borderColor: 'divider',
    backgroundColor: 'transparent',
};

const styles: SxStyles = {
    card,
    selectedCard: {
        ...card,
        borderColor: 'primary.main',
        backgroundColor: 'action.hover',
    },
    text: { flex: '1 1 auto', minWidth: 0 },
};

export const SourceCard: FunctionComponent<Props> = ({
    source,
    selected,
    onSelect,
}) => {
    const { formatMessage } = useSafeIntl();
    const RadioIcon = selected
        ? RadioButtonCheckedIcon
        : RadioButtonUncheckedIcon;
    const isGoodMatch =
        source.mappingsCount > 0 &&
        source.matchingCount / source.mappingsCount >= 0.5;
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect();
        }
    };
    return (
        <Box
            role="radio"
            aria-checked={selected}
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={handleKeyDown}
            data-test={`import-source-${source.id}`}
            sx={selected ? styles.selectedCard : styles.card}
        >
            <RadioIcon color={selected ? 'primary' : 'action'} />
            <Box sx={styles.text}>
                <Typography variant="body1">{source.title}</Typography>
                <Typography variant="caption" color="textSecondary">
                    {source.meta}
                </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
                {formatMessage(MESSAGES.importMappingsCount, {
                    count: source.mappingsCount,
                })}
            </Typography>
            <Chip
                size="small"
                variant="outlined"
                color={isGoodMatch ? 'success' : 'warning'}
                label={formatMessage(MESSAGES.importMatchCount, {
                    matching: source.matchingCount,
                    total: source.mappingsCount,
                })}
            />
        </Box>
    );
};
