import React, { FunctionComponent } from 'react';
import { SubmissionRow } from '../../types';
import { KeyValueTable } from './KeyValueTable';
import { displayValue } from './utils';

export const SubmissionRowsTable: FunctionComponent<{
    rows: SubmissionRow[];
    emptyMessage?: string;
}> = ({ rows, emptyMessage }) => (
    <KeyValueTable
        rows={rows.map(({ key, value }) => ({
            key,
            value: displayValue(value),
        }))}
        emptyMessage={emptyMessage}
    />
);
