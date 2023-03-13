import React, { ReactNode } from 'react';
import { Row } from './Row';
import { RowArray } from './RowArray';
import { RowObject } from './RowObject';

export const mapLogStructure = (structure, logDetail): ReactNode[] => {
    return structure.map(
        ({ type, getLogValue, key, children, childrenLabel }) => {
            // if (type === 'array' && children) {
            //     return (
            //         <RowArray
            //             key={key}
            //             logKey={key}
            //             logDetail={logDetail}
            //             childrenArray={children}
            //             childrenLabel={childrenLabel}
            //         />
            //     );
            // }
            if ((type === 'object' || type === 'array') && children) {
                return (
                    <RowObject
                        key={key}
                        logKey={key}
                        logDetail={logDetail}
                        childrenArray={children}
                        childrenLabel={childrenLabel}
                        type={type}
                    />
                );
            }
            return (
                <Row
                    key={key}
                    value={
                        getLogValue ? getLogValue(logDetail) : logDetail[key]
                    }
                    fieldKey={key}
                />
            );
        },
    );
};
