import { cloneDeep } from 'lodash';
import React, { FunctionComponent, useCallback, useMemo } from 'react';

import InputComponent from '../../../../components/forms/InputComponent';
import { useGetUnUsedChangesOptions } from '../../hooks/useGetUnUsedChangesOptions';
import { ChangesOption, Mapping } from '../../types';

type Props = {
    targetOptions: ChangesOption[];
    sourceOptions: ChangesOption[];
    handleUpdate: (
        key: keyof Mapping,
        value: string | undefined,
        index: number,
    ) => void;
    rowIndex: number;
    value: string;
    mappingArray: Mapping[];
};

export const TargetCell: FunctionComponent<Props> = ({
    targetOptions,
    sourceOptions,
    handleUpdate,
    rowIndex,
    value,
    mappingArray,
}) => {
    const getUnUsedOptions = useGetUnUsedChangesOptions({
        mappingKey: 'target',
        mappingArray,
        value,
    });

    const sourceKey: string | undefined = mappingArray[rowIndex]?.source;

    const sourceType = sourceOptions.find(
        option => option.value === sourceKey,
    )?.type;

    const options = useMemo(() => {
        let newOptions: ChangesOption[] = cloneDeep(targetOptions);
        if (sourceKey && sourceType) {
            // only use target option of the same type as the source
            newOptions = newOptions.filter(
                option =>
                    option.type === sourceType ||
                    sourceType === 'calculate' ||
                    option.type === 'calculate',
            );
        }
        // remove already selected options
        return getUnUsedOptions(newOptions);
    }, [getUnUsedOptions, sourceKey, sourceType, targetOptions]);

    const handleChange = useCallback(
        (_, newValue) => {
            handleUpdate('target', newValue, rowIndex);
        },
        [handleUpdate, rowIndex],
    );

    return (
        <InputComponent
            disabled={!sourceKey}
            withMarginTop={false}
            type="select"
            clearable={false}
            keyValue="target"
            onChange={handleChange}
            value={value}
            labelString=""
            required
            options={options}
        />
    );
};
