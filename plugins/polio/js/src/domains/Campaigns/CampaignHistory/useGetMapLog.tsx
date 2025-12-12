import React, { ReactNode, useCallback } from 'react';
import { MultiRows } from './MultiRows';
import { Row } from './Row';

export const useGetMapLog = (
    structure: Record<string, any>,
): ((logDetail: Record<string, any>) => ReactNode[]) => {
    const getlogRows = useCallback(
        logDetail =>
            structure.map(
                ({ type, getLogValue, key, children, childrenLabel }) => {
                    if (!logDetail[key]) return null;
                    if ((type === 'object' || type === 'array') && children) {
                        return (
                            <MultiRows
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
                                getLogValue
                                    ? getLogValue(logDetail)
                                    : logDetail[key] || '--'
                            }
                            fieldKey={key}
                        />
                    );
                },
            ),
        [structure],
    );
    return getlogRows;
};
