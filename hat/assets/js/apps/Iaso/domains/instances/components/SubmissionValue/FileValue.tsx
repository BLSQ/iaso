import React, { FunctionComponent, useMemo } from 'react';
import { Box } from '@mui/material';
import DocumentsItemComponent from 'Iaso/components/files/DocumentsItemComponent';
import VideoItemComponent from 'Iaso/components/files/VideoItemComponent';
import { getFileName, getFileType } from 'Iaso/utils/filesUtils';
import { slugifyValue } from '../../utils/questions';
import { SubmissionField } from '../SubmissionContent/types';
import { EmptyValue } from './EmptyValue';
import { PreviewImage } from './PreviewImage';

type Props = {
    field: SubmissionField;
    files: string[];
};

/**
 * Resolve the uploaded file matching a question's value. Mirrors the matching
 * done in InstanceFileContentRich, including the jpg -> webp conversion the
 * backend applies to images.
 */
export const useFileUrl = (
    value: unknown,
    files: string[],
): string | undefined =>
    useMemo(() => {
        if (typeof value !== 'string' || !value || files.length === 0) {
            return undefined;
        }
        const slugified = slugifyValue(value);
        return files.find(f =>
            slugified.endsWith('jpg')
                ? f.includes(slugified) ||
                  f.includes(slugified.replace('.jpg', '.webp'))
                : f.includes(slugified),
        );
    }, [value, files]);

export const FileValue: FunctionComponent<Props> = ({ field, files }) => {
    const fileUrl = useFileUrl(field.rawValue, files);
    const fileName =
        typeof field.rawValue === 'string'
            ? getFileName(field.rawValue)
            : undefined;
    const fileType = fileName ? getFileType(fileName) : undefined;

    if (!fileUrl || !fileName) return <EmptyValue />;
    if (fileType === 'image') {
        return <PreviewImage url={fileUrl} alt={field.id} />;
    }
    if (fileType === 'video') {
        return (
            <Box sx={{ height: 200 }}>
                <VideoItemComponent
                    videoPath={fileUrl}
                    fileInfo={fileName.name}
                />
            </Box>
        );
    }
    return (
        <Box sx={{ width: 150 }}>
            <DocumentsItemComponent filePath={fileUrl} />
        </Box>
    );
};
