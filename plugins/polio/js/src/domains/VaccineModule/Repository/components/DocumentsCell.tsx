import React, { ReactElement } from 'react';
import { DocumentData } from '../types';
import { DocumentCell } from './DocumentCell';

export const DocumentsCells = (cellInfo: {
    value?: DocumentData[];
}): ReactElement => {
    const value = cellInfo?.value ?? [];
    return (
        <>
            {value.map(({ date, file }) => (
                <DocumentCell key={`${file}${date}`} date={date} file={file} />
            ))}
        </>
    );
};
