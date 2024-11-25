import React, { ReactElement } from 'react';
import { DocumentData } from '../types';
import { FormADocumentCell } from './FormADocumentCell';

export const FormADocumentsCells = (cellInfo: {
    value?: (DocumentData & { is_late: boolean })[];
}): ReactElement => {
    const value = cellInfo?.value ?? [];
    return (
        <>
            {value.map(({ date, file, is_late }, index) => (
                <FormADocumentCell
                    key={`${file}${index}`}
                    date={date}
                    file={file}
                    isLate={is_late}
                />
            ))}
        </>
    );
};
