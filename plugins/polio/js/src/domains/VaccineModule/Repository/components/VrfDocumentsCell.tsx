import React, { ReactElement } from 'react';
import { DocumentData } from '../types';
import { VrfDocumentCell } from './VrfDocumentCell';

export const VrfDocumentsCells = (cellInfo: {
    value?: (DocumentData & {
        is_not_required: boolean;
        is_missing: boolean;
    })[];
}): ReactElement => {
    const value = cellInfo?.value ?? [];
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
