import React, { ChangeEvent, FunctionComponent, useRef } from 'react';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Alert, Box, Button, Divider, Typography } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';
import { ImportSource } from '../../types';
import { SourceCard } from './SourceCard';

type Props = {
    sources: ImportSource[];
    selectedId?: string;
    onSelect: (id: string) => void;
    onFileChosen: (file: File) => void;
    fileError?: string;
    // the file targets another DHIS2 dataset or program
    fileWarning?: string;
    isLoading: boolean;
};

const styles: SxStyles = {
    divider: { mt: 2 },
    fileRow: { display: 'flex', alignItems: 'center', gap: 1.5, pt: 2 },
    fileText: { flex: '1 1 auto' },
    fileAlert: { mt: 1.5 },
};

export const SourceStep: FunctionComponent<Props> = ({
    sources,
    selectedId,
    onSelect,
    onFileChosen,
    fileError,
    fileWarning,
    isLoading,
}) => {
    const { formatMessage } = useSafeIntl();
    const fileInput = useRef<HTMLInputElement>(null);
    const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileChosen(file);
        }
        // allow choosing the same file again
        event.target.value = '';
    };
    return (
        <Box>
            <Typography variant="body2" color="textSecondary" mb={1.5}>
                {formatMessage(MESSAGES.importPickSource)}
            </Typography>
            {isLoading && <LoadingSpinner absolute />}
            {!isLoading && sources.length === 0 && (
                <Alert severity="info">
                    {formatMessage(MESSAGES.importNoSource)}
                </Alert>
            )}
            {sources.map(source => (
                <SourceCard
                    key={source.id}
                    source={source}
                    selected={source.id === selectedId}
                    onSelect={() => onSelect(source.id)}
                />
            ))}
            <Divider sx={styles.divider} />
            <Box sx={styles.fileRow}>
                <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={styles.fileText}
                >
                    {formatMessage(MESSAGES.importFromFile)}
                </Typography>
                <input
                    ref={fileInput}
                    type="file"
                    accept=".json,application/json"
                    hidden
                    onChange={onFileChange}
                    data-test="import-mappings-file"
                />
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<UploadFileIcon />}
                    onClick={() => fileInput.current?.click()}
                >
                    {formatMessage(MESSAGES.chooseFile)}
                </Button>
            </Box>
            {fileError && (
                <Alert severity="error" sx={styles.fileAlert}>
                    {fileError}
                </Alert>
            )}
            {fileWarning && (
                <Alert severity="warning" sx={styles.fileAlert}>
                    {fileWarning}
                </Alert>
            )}
        </Box>
    );
};
