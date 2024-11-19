import React, { ReactElement } from 'react';
import { DocumentData } from '../types';
import { DocumentCell } from './DocumentCell';
import { VrfDocumentCell } from './VrfDocumentCell';

export const VrfDocumentsCells = (cellInfo: {
    value?: (DocumentData & { is_not_required: boolean })[];
}): ReactElement => {
    const value = cellInfo?.value ?? [];
    if (value.length === 0) {
        return <DocumentCell />;
    }
    return (
        <>
            {value.map(({ date, file, is_not_required, is_missing }, index) => (
                <VrfDocumentCell
                    key={`${file}${index}`}
                    date={date}
                    file={file}
                    isRequired={!is_not_required}
                    isMissing={is_missing}
                />
            ))}
        </>
    );
};
