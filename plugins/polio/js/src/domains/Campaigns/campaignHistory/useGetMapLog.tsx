import React, { ReactNode, useCallback } from 'react';
import { Row } from './Row';
import { MultiRows } from './MultiRows';

export const useGetMapLog = (
    structure: Record<string, any>,
    // eslint-disable-next-line no-unused-vars
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
