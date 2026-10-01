import React, { FunctionComponent, useState } from 'react';
import DownloadIcon from '@mui/icons-material/Download';
import InputIcon from '@mui/icons-material/Input';
import UndoIcon from '@mui/icons-material/Undo';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { openSnackBar } from '../../../../components/snackBars/EventDispatcher';
import { succesfullSnackBar } from '../../../../constants/snackBars';
import { SxStyles } from '../../../../types/general';
import { useBulkUpdateQuestionMappings } from '../../hooks/requests/useBulkUpdateQuestionMappings';
import { buildMappingExport, getExportFileName } from '../../importMappings';
import MESSAGES from '../../messages';
import { ImportPlan, MappingVersionRow } from '../../types';
import { ImportMappingsDialog } from './ImportMappingsDialog';

type Props = {
    mappingVersion: MappingVersionRow;
    questions: Record<string, any>;
};

const styles: SxStyles = {
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 },
};

const downloadJson = (content: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(content, null, 2)], {
        type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
};

export const MappingImportActions: FunctionComponent<Props> = ({
    mappingVersion,
    questions,
}) => {
    const { formatMessage } = useSafeIntl();
    const [open, setOpen] = useState(false);
    // payload restoring the mappings as they were before the last import
    const [undoPayload, setUndoPayload] = useState<ImportPlan['undo']>();
    const { mutateAsync: bulkUpdate, isLoading } =
        useBulkUpdateQuestionMappings();

    const onApply = async (plan: ImportPlan) => {
        await bulkUpdate({
            mappingVersionId: mappingVersion.id,
            questionMappings: plan.changes,
        });
        setUndoPayload(plan.undo);
        openSnackBar(
            succesfullSnackBar(
                undefined,
                formatMessage(MESSAGES.importDone, {
                    added: plan.added,
                    overwritten: plan.overwritten,
                    kept: plan.kept,
                    ignored: plan.dropped + plan.skipped,
                }),
            ),
        );
    };

    const onUndo = async () => {
        await bulkUpdate({
            mappingVersionId: mappingVersion.id,
            questionMappings: undoPayload ?? {},
        });
        setUndoPayload(undefined);
        openSnackBar(
            succesfullSnackBar(undefined, formatMessage(MESSAGES.importUndone)),
        );
    };

    return (
        <Box sx={styles.actions}>
            {undoPayload && (
                <Button
                    startIcon={<UndoIcon />}
                    onClick={onUndo}
                    disabled={isLoading}
                    data-test="undo-import-mappings"
                >
                    {formatMessage(MESSAGES.undoImport)}
                </Button>
            )}
            <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() =>
                    downloadJson(
                        buildMappingExport(mappingVersion),
                        getExportFileName(mappingVersion),
                    )
                }
                data-test="export-mappings"
            >
                {formatMessage(MESSAGES.exportMappings)}
            </Button>
            <Button
                variant="contained"
                startIcon={<InputIcon />}
                onClick={() => setOpen(true)}
                data-test="import-mappings"
            >
                {formatMessage(MESSAGES.importMappings)}
            </Button>
            <ImportMappingsDialog
                open={open}
                closeDialog={() => setOpen(false)}
                mappingVersion={mappingVersion}
                questions={questions}
                onApply={onApply}
            />
        </Box>
    );
};
