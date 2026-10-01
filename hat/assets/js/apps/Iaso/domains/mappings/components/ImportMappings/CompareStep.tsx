import React, { FunctionComponent, useMemo } from 'react';
import {
    Box,
    Button,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { textPlaceholder } from '../../../../constants/uiConstants';
import { SxStyles } from '../../../../types/general';
import { DIFF_KINDS, getMappingLabel } from '../../importMappings';
import MESSAGES from '../../messages';
import { isNeverMapped } from '../../question_mappings';
import { Decision, DiffKind, DiffRow, ImportPlan } from '../../types';

type Props = {
    sourceTitle: string;
    versionId: string;
    mappingType: string;
    rows: DiffRow[];
    bucket: DiffKind;
    setBucket: (bucket: DiffKind) => void;
    decisions: Record<string, Decision | undefined>;
    setDecision: (questionKey: string, decision: Decision) => void;
    setBulkDecision: (kind: DiffKind, decision: Decision) => void;
    plan: ImportPlan;
};

const BUCKET_MESSAGES: Record<DiffKind, IntlMessage> = {
    conflict: MESSAGES.bucketConflict,
    add: MESSAGES.bucketAdd,
    identical: MESSAGES.bucketIdentical,
    dropped: MESSAGES.bucketDropped,
};

type Choice = { decision: Decision; message: IntlMessage };

const CHOICES: Partial<Record<DiffKind, Choice[]>> = {
    conflict: [
        { decision: 'keep', message: MESSAGES.keep },
        { decision: 'overwrite', message: MESSAGES.overwrite },
    ],
    add: [
        { decision: 'skip', message: MESSAGES.skip },
        { decision: 'apply', message: MESSAGES.add },
    ],
};

const BULK: Record<DiffKind, { message: IntlMessage; actions: Choice[] }> = {
    conflict: {
        message: MESSAGES.resolveAllConflicts,
        actions: [
            { decision: 'keep', message: MESSAGES.keepEverywhere },
            { decision: 'overwrite', message: MESSAGES.overwriteEverywhere },
        ],
    },
    add: {
        message: MESSAGES.allAdditions,
        actions: [
            { decision: 'apply', message: MESSAGES.addAll },
            { decision: 'skip', message: MESSAGES.skipAll },
        ],
    },
    identical: { message: MESSAGES.identicalHint, actions: [] },
    dropped: { message: MESSAGES.droppedHint, actions: [] },
};

const styles: SxStyles = {
    tabs: { borderBottom: 1, borderColor: 'divider', mt: 1 },
    bulkRow: { display: 'flex', alignItems: 'center', gap: 1, minHeight: 44 },
    table: { maxHeight: '40vh' },
    questionColumn: { width: 240 },
    decisionColumn: { width: 210 },
    current: { color: 'text.primary' },
    noCurrent: { color: 'text.disabled' },
    choices: { display: 'flex', gap: 0.75, justifyContent: 'flex-end' },
    summary: { mt: 1.5 },
};

export const CompareStep: FunctionComponent<Props> = ({
    sourceTitle,
    versionId,
    mappingType,
    rows,
    bucket,
    setBucket,
    decisions,
    setDecision,
    setBulkDecision,
    plan,
}) => {
    const { formatMessage } = useSafeIntl();
    const counts = useMemo(() => {
        const result = { conflict: 0, add: 0, identical: 0, dropped: 0 };
        rows.forEach(row => {
            result[row.kind] += 1;
        });
        return result;
    }, [rows]);
    const bucketRows = rows.filter(row => row.kind === bucket);
    const bulk = BULK[bucket];

    const getCurrentLabel = (row: DiffRow): string => {
        if (isNeverMapped(row.current)) {
            return formatMessage(MESSAGES.markedNeverMapped);
        }
        if (row.kind !== 'dropped') {
            return getMappingLabel(row.current) || textPlaceholder;
        }
        return row.invalid
            ? formatMessage(MESSAGES.importInvalidMapping, {
                  type: mappingType,
              })
            : formatMessage(MESSAGES.questionAbsent, { versionId });
    };

    return (
        <Box>
            <Typography variant="body2" color="textSecondary">
                {formatMessage(MESSAGES.compareLabel, {
                    source: sourceTitle,
                    versionId,
                })}
            </Typography>
            <Tabs
                value={bucket}
                onChange={(_, value) => setBucket(value)}
                indicatorColor="primary"
                textColor="primary"
                sx={styles.tabs}
            >
                {DIFF_KINDS.map(kind => (
                    <Tab
                        key={kind}
                        value={kind}
                        label={formatMessage(BUCKET_MESSAGES[kind], {
                            count: counts[kind],
                        })}
                        data-test={`import-bucket-${kind}`}
                    />
                ))}
            </Tabs>
            <Box sx={styles.bulkRow}>
                <Typography variant="body2" color="textSecondary">
                    {formatMessage(bulk.message)}
                </Typography>
                {bulk.actions.map(action => (
                    <Button
                        key={action.decision}
                        size="small"
                        onClick={() => setBulkDecision(bucket, action.decision)}
                        disabled={bucketRows.length === 0}
                    >
                        {formatMessage(action.message)}
                    </Button>
                ))}
            </Box>
            <TableContainer sx={styles.table}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={styles.questionColumn}>
                                {formatMessage(MESSAGES.question)}
                            </TableCell>
                            <TableCell>
                                {formatMessage(
                                    bucket === 'dropped'
                                        ? MESSAGES.question
                                        : MESSAGES.currentMapping,
                                )}
                            </TableCell>
                            <TableCell>
                                {formatMessage(MESSAGES.incomingMapping)}
                            </TableCell>
                            <TableCell align="right" sx={styles.decisionColumn}>
                                {formatMessage(MESSAGES.decision)}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {bucketRows.map(row => {
                            const decision = decisions[row.questionKey];
                            const choices = CHOICES[row.kind];
                            return (
                                <TableRow
                                    key={row.questionKey}
                                    hover
                                    data-test={`import-row-${row.questionKey}`}
                                >
                                    <TableCell>
                                        {/* dropped questions have no label: the name alone is the title */}
                                        <Typography
                                            variant="body2"
                                            fontWeight={500}
                                            noWrap
                                            title={
                                                row.questionLabel ??
                                                row.questionKey
                                            }
                                        >
                                            {row.questionLabel ??
                                                row.questionKey}
                                        </Typography>
                                        {row.questionLabel &&
                                            row.questionLabel !==
                                                row.questionKey && (
                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                    fontFamily="monospace"
                                                    component="div"
                                                >
                                                    {row.questionKey}
                                                </Typography>
                                            )}
                                    </TableCell>
                                    <TableCell
                                        sx={
                                            row.current &&
                                            !isNeverMapped(row.current)
                                                ? styles.current
                                                : styles.noCurrent
                                        }
                                    >
                                        {getCurrentLabel(row)}
                                    </TableCell>
                                    <TableCell>
                                        {getMappingLabel(row.incoming)}
                                    </TableCell>
                                    <TableCell align="right">
                                        {choices ? (
                                            <Box sx={styles.choices}>
                                                {choices.map(choice => (
                                                    <Button
                                                        key={choice.decision}
                                                        size="small"
                                                        variant={
                                                            decision ===
                                                            choice.decision
                                                                ? 'contained'
                                                                : 'outlined'
                                                        }
                                                        onClick={() =>
                                                            setDecision(
                                                                row.questionKey,
                                                                choice.decision,
                                                            )
                                                        }
                                                    >
                                                        {formatMessage(
                                                            choice.message,
                                                        )}
                                                    </Button>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography
                                                variant="body2"
                                                color="textSecondary"
                                            >
                                                {formatMessage(
                                                    row.kind === 'identical'
                                                        ? MESSAGES.noChange
                                                        : MESSAGES.notImportable,
                                                )}
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            <Typography variant="body2" sx={styles.summary}>
                {formatMessage(MESSAGES.importSummary, {
                    added: plan.added,
                    overwritten: plan.overwritten,
                    ignored: plan.dropped + plan.skipped,
                })}
            </Typography>
        </Box>
    );
};
