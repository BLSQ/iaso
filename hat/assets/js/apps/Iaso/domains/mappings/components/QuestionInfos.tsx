import React, { FunctionComponent } from 'react';
import { ArrowBack } from '@mui/icons-material';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../types/general';
import Descriptor from '../descriptor';
import MESSAGES from '../messages';
import { QuestionStatus } from '../types';
import { ChipsRow } from './QuestionPanel/ChipsRow';
import { LabeledValue } from './QuestionPanel/LabeledValue';
import { MappingCard } from './QuestionPanel/MappingCard';
import {
    QuestionStatusIcon,
    STATUS_MESSAGES,
} from './QuestionTree/QuestionTreeLabel';

const styles: SxStyles = {
    status: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 2,
        minWidth: 0,
    },
    groupLabel: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    // fixed columns and one line per value, so the card keeps its height
    fields: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 2,
    },
    options: {
        mt: 2,
    },
};

const MAX_VISIBLE_OPTIONS = 4;

const formatBind = (bind?: Record<string, unknown>) =>
    bind
        ? Object.entries(bind)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
        : undefined;

type Props = {
    question: Record<string, any>;
    status: QuestionStatus;
    groupLabel?: string;
    onClose: () => void;
};

const QuestionInfos: FunctionComponent<Props> = ({
    question,
    status,
    groupLabel,
    onClose,
}) => {
    const { formatMessage } = useSafeIntl();
    const backLabel = formatMessage(MESSAGES.backToGeneral);
    const choices: Record<string, any>[] =
        question.type === 'select one' ? (question.children ?? []) : [];
    return (
        <MappingCard
            title={Descriptor.getHumanLabel(question)}
            startAdornment={
                <Tooltip title={backLabel}>
                    <IconButton
                        size="small"
                        aria-label={backLabel}
                        onClick={onClose}
                    >
                        <ArrowBack />
                    </IconButton>
                </Tooltip>
            }
        >
            <Box sx={styles.status}>
                <Chip
                    size="small"
                    variant="outlined"
                    icon={<QuestionStatusIcon status={status} decorative />}
                    label={formatMessage(STATUS_MESSAGES[status])}
                />
                {groupLabel && (
                    <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={styles.groupLabel}
                        title={groupLabel}
                    >
                        {groupLabel}
                    </Typography>
                )}
            </Box>
            <Box sx={styles.fields}>
                <LabeledValue
                    label={formatMessage(MESSAGES.name)}
                    value={question.name}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.type)}
                    value={question.type}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.bind)}
                    value={formatBind(question.bind)}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.path)}
                    value={question.path?.join(' / ')}
                />
            </Box>
            <Box sx={styles.options}>
                <Typography variant="caption" color="textSecondary">
                    {formatMessage(MESSAGES.questionOptions)}
                </Typography>
                <ChipsRow
                    key={question.name}
                    items={choices.map(choice => ({
                        key: choice.name,
                        label: Descriptor.getHumanLabel(choice),
                        title: choice.name,
                    }))}
                    maxVisible={MAX_VISIBLE_OPTIONS}
                />
            </Box>
        </MappingCard>
    );
};

export default QuestionInfos;
