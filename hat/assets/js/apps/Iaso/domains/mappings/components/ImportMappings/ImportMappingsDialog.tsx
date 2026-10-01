import React, { FunctionComponent, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import { useImportSources } from '../../hooks/useImportSources';
import {
    buildImportPlan,
    computeMappingsDiff,
    countMatchingMappings,
    getDefaultDecision,
    getImportableMappings,
    MappingImportError,
    parseMappingExport,
} from '../../importMappings';
import MESSAGES from '../../messages';
import {
    Decision,
    DiffKind,
    ImportPlan,
    ImportSource,
    MappingVersionRow,
} from '../../types';
import { CompareStep } from './CompareStep';
import { SourceStep } from './SourceStep';

type Props = {
    open: boolean;
    closeDialog: () => void;
    mappingVersion: MappingVersionRow;
    questions: Record<string, any>;
    onApply: (plan: ImportPlan) => Promise<unknown>;
};

const FILE_SOURCE_ID = 'file';

const IMPORT_ERROR_MESSAGES = {
    invalidJson: MESSAGES.importInvalidJson,
    invalidFormat: MESSAGES.importInvalidFormat,
    mappingTypeMismatch: MESSAGES.importMappingTypeMismatch,
};

const styles: SxStyles = {
    content: { position: 'relative', minHeight: 200 },
};

export const ImportMappingsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    mappingVersion,
    questions,
    onApply,
}) => {
    const { formatMessage } = useSafeIntl();
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [fileSource, setFileSource] = useState<ImportSource | undefined>();
    const [fileError, setFileError] = useState<string | undefined>();
    const [bucket, setBucket] = useState<DiffKind>('conflict');
    const [decisions, setDecisions] = useState<
        Record<string, Decision | undefined>
    >({});
    const [isApplying, setIsApplying] = useState(false);

    const { sources: versionSources, isLoading } = useImportSources(
        mappingVersion,
        questions,
        open,
    );
    const sources = fileSource
        ? [fileSource, ...versionSources]
        : versionSources;
    const selectedSource = sources.find(s => s.id === selectedId) ?? sources[0];

    const rows = useMemo(
        () =>
            selectedSource && step === 2
                ? computeMappingsDiff(
                      mappingVersion.question_mappings,
                      selectedSource.questionMappings,
                      questions,
                  )
                : [],
        [selectedSource, step, mappingVersion.question_mappings, questions],
    );
    const plan = useMemo(
        () => buildImportPlan(rows, decisions),
        [rows, decisions],
    );
    const changesCount = Object.keys(plan.changes).length;

    const reset = () => {
        setStep(1);
        setSelectedId(undefined);
        setFileSource(undefined);
        setFileError(undefined);
        setDecisions({});
    };
    const handleClose = () => {
        reset();
        closeDialog();
    };

    const onFileChosen = async (file: File) => {
        setFileError(undefined);
        try {
            const content = parseMappingExport(
                await file.text(),
                mappingVersion.mapping.mapping_type,
            );
            const questionMappings = getImportableMappings(
                content.question_mappings,
            );
            setFileSource({
                id: FILE_SOURCE_ID,
                title: file.name,
                meta: content.form
                    ? formatMessage(MESSAGES.importFileMeta, {
                          formName: content.form.name,
                          versionId: content.form_version?.version_id,
                      })
                    : '',
                mappingsCount: Object.keys(questionMappings).length,
                matchingCount: countMatchingMappings(
                    questionMappings,
                    questions,
                ),
                questionMappings,
            });
            setSelectedId(FILE_SOURCE_ID);
        } catch (e) {
            if (e instanceof MappingImportError) {
                setFileError(formatMessage(IMPORT_ERROR_MESSAGES[e.reason]));
            } else {
                throw e;
            }
        }
    };

    const goToCompare = () => {
        const diff = computeMappingsDiff(
            mappingVersion.question_mappings,
            selectedSource.questionMappings,
            questions,
        );
        setDecisions(
            Object.fromEntries(
                diff.map(row => [row.questionKey, getDefaultDecision(row)]),
            ),
        );
        const firstBucket = diff.some(row => row.kind === 'conflict')
            ? 'conflict'
            : 'add';
        setBucket(firstBucket);
        setStep(2);
    };

    const apply = async () => {
        setIsApplying(true);
        try {
            await onApply(plan);
            handleClose();
        } finally {
            setIsApplying(false);
        }
    };

    const setDecision = (questionKey: string, decision: Decision) =>
        setDecisions(current => ({ ...current, [questionKey]: decision }));
    const setBulkDecision = (kind: DiffKind, decision: Decision) =>
        setDecisions(current => {
            const next = { ...current };
            rows.filter(row => row.kind === kind).forEach(row => {
                next[row.questionKey] = decision;
            });
            return next;
        });

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            data-test="import-mappings-dialog"
        >
            <DialogTitle>{formatMessage(MESSAGES.importMappings)}</DialogTitle>
            <DialogContent sx={styles.content}>
                {step === 1 && (
                    <SourceStep
                        sources={sources}
                        selectedId={selectedSource?.id}
                        onSelect={setSelectedId}
                        onFileChosen={onFileChosen}
                        fileError={fileError}
                        isLoading={isLoading}
                    />
                )}
                {step === 2 && selectedSource && (
                    <CompareStep
                        sourceTitle={selectedSource.title}
                        versionId={mappingVersion.form_version.version_id}
                        rows={rows}
                        bucket={bucket}
                        setBucket={setBucket}
                        decisions={decisions}
                        setDecision={setDecision}
                        setBulkDecision={setBulkDecision}
                        plan={plan}
                    />
                )}
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={step === 1 ? handleClose : () => setStep(1)}
                    color="primary"
                    data-test="cancel-button"
                >
                    {formatMessage(
                        step === 1 ? MESSAGES.cancel : MESSAGES.back,
                    )}
                </Button>
                {step === 1 ? (
                    <Button
                        onClick={goToCompare}
                        color="primary"
                        disabled={!selectedSource}
                        data-test="confirm-button"
                    >
                        {formatMessage(MESSAGES.compare)}
                    </Button>
                ) : (
                    <Button
                        onClick={apply}
                        color="primary"
                        variant="contained"
                        disabled={changesCount === 0 || isApplying}
                        data-test="confirm-button"
                    >
                        {formatMessage(MESSAGES.applyChanges, {
                            count: changesCount,
                        })}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};
