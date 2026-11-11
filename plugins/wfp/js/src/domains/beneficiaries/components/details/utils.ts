import { ReactNode } from 'react';
import { SubmissionRow } from '../../types';

export const submissionUrl = (instanceId: number) =>
    `/dashboard/forms/submission/instanceId/${instanceId}`;

export const joinDot = (parts: ReactNode[]): ReactNode[] =>
    parts
        .filter(part => part !== '' && part !== null && part !== undefined)
        .flatMap((part, index) => (index === 0 ? [part] : [' · ', part]));

export const displayValue = (value: SubmissionRow['value']): string =>
    value === null || value === undefined ? '' : String(value);
