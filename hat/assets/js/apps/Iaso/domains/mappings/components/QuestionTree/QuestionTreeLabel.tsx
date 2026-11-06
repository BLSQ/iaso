import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import { QUESTION_STATUS_MESSAGES } from '../../config';
import MESSAGES from '../../messages';
import { QuestionTreeNode } from '../../types';
import { QuestionStatusIcon } from '../QuestionStatusIcon';

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        minWidth: 0,
        py: 0.25,
    },
    text: {
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    target: {
        color: 'text.secondary',
    },
    groupText: {
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontWeight: 'bold',
    },
    count: {
        flex: '0 0 auto',
        color: 'text.secondary',
        fontVariantNumeric: 'tabular-nums',
    },
};

type Props = {
    node: QuestionTreeNode;
};

export const QuestionTreeLabel: FunctionComponent<Props> = ({ node }) => {
    const { formatMessage } = useSafeIntl();
    if (node.children) {
        const progress = formatMessage(MESSAGES.mappedProgress, {
            mapped: node.mappedCount,
            total: node.questionsCount,
        });
        return (
            <Box sx={styles.root} title={`${node.label}\n${progress}`}>
                <Typography variant="body2" sx={styles.groupText}>
                    {node.label}
                </Typography>
                <Typography variant="caption" sx={styles.count}>
                    {`${node.mappedCount} / ${node.questionsCount}`}
                </Typography>
                {node.selectable && <QuestionStatusIcon status={node.status} />}
            </Box>
        );
    }
    const statusText = node.target
        ? formatMessage(MESSAGES.mappedTo, { target: node.target })
        : formatMessage(QUESTION_STATUS_MESSAGES[node.status]);
    return (
        <Box
            sx={styles.root}
            title={[node.label, node.name, node.type, statusText].join('\n')}
        >
            <Typography variant="body2" sx={styles.text}>
                {node.label}
                {node.target && (
                    <Box component="span" sx={styles.target}>
                        {` → ${node.target}`}
                    </Box>
                )}
            </Typography>
            <QuestionStatusIcon status={node.status} />
        </Box>
    );
};
