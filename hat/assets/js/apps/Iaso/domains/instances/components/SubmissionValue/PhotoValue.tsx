import React, { FunctionComponent } from 'react';
import { SubmissionField } from '../SubmissionContent/types';
import { EmptyValue } from './EmptyValue';
import { useFileUrl } from './FileValue';
import { PreviewImage } from './PreviewImage';

type Props = {
    field: SubmissionField;
    files: string[];
};

export const PhotoValue: FunctionComponent<Props> = ({ field, files }) => {
    const fileUrl = useFileUrl(field.rawValue, files);
    if (!fileUrl) return <EmptyValue />;
    return <PreviewImage url={fileUrl} alt={field.id} />;
};
