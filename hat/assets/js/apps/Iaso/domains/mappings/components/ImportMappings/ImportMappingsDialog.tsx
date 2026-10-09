import React, { FunctionComponent, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from '@mui/material';
import { IntlMessage, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import { useImportSources } from '../../hooks/useImportSources';
import {
    buildImportPlan,
    computeMappingsDiff,
    countMatchingMappings,
    getDefaultDecision,
    getImportableMappings,
    getOtherTarget,
    MappingImportError,
    parseMappingExport,
} from '../../importMappings';
import MESSAGES from '../../messages';
import {
    Decision,
    DiffKind,
    ImportPlan,
    ImportSource,
    MappingImportErrorReason,
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

const IMPORT_ERROR_MESSAGES: Record<MappingImportErrorReason, IntlMessage> = {
    [MappingImportErrorReason.INVALID_JSON]: MESSAGES.importInvalidJson,
    [MappingImportErrorReason.INVALID_FORMAT]: MESSAGES.importInvalidFormat,
    [MappingImportErrorReason.MAPPING_TYPE_MISMATCH]:
        MESSAGES.importMappingTypeMismatch,
    [MappingImportErrorReason.NO_VALID_MAPPING]: MESSAGES.importNoValidMapping,
};

const OTHER_TARGET_MESSAGES = {
    dataset: MESSAGES.importOtherDataset,
    program: MESSAGES.importOtherProgram,
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
    const [fileWarning, setFileWarning] = useState<string | undefined>();
    const [bucket, setBucket] = useState<DiffKind>(DiffKind.CONFLICT);
    const [decisions, setDecisions] = useState<
        Record<string, Decision | undefined>
    >({});
    const [isApplying, setIsApplying] = useState(false);

    const mappingType = mappingVersion.mapping.mapping_type;
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
                      mappingType,
                  )
                : [],
        [
            selectedSource,
            step,
            mappingVersion.question_mappings,
            questions,
            mappingType,
        ],
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
        setFileWarning(undefined);
        setDecisions({});
    };
    const handleClose = () => {
        reset();
        closeDialog();
    };

    const onFileChosen = async (file: File) => {
        setFileError(undefined);
        setFileWarning(undefined);
        try {
            const content = parseMappingExport(await file.text(), mappingType);
            const otherTarget = getOtherTarget(content, mappingVersion);
            if (otherTarget) {
                setFileWarning(
                    formatMessage(OTHER_TARGET_MESSAGES[otherTarget.kind], {
                        name: otherTarget.name,
                    }),
                );
            }
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
                    mappingType,
                ),
                questionMappings,
            });
            setSelectedId(FILE_SOURCE_ID);
        } catch (e) {
            if (e instanceof MappingImportError) {
                setFileError(
                    formatMessage(IMPORT_ERROR_MESSAGES[e.reason], {
                        type: mappingType,
                    }),
                );
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
            mappingType,
        );
        setDecisions(
            Object.fromEntries(
                diff.map(row => [row.questionKey, getDefaultDecision(row)]),
            ),
        );
        const firstBucket = diff.some(row => row.kind === DiffKind.CONFLICT)
            ? DiffKind.CONFLICT
            : DiffKind.ADD;
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
                        fileWarning={
                            selectedSource?.id === FILE_SOURCE_ID
                                ? fileWarning
                                : undefined
                        }
                        isLoading={isLoading}
                    />
                )}
                {step === 2 && selectedSource && (
                    <CompareStep
                        sourceTitle={selectedSource.title}
                        versionId={mappingVersion.form_version.version_id}
                        mappingType={mappingType}
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
