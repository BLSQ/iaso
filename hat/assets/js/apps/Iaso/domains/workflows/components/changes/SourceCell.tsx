import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { cloneDeep } from 'lodash';

import InputComponent from '../../../../components/forms/InputComponent';
import { ChangesOption, Mapping } from '../../types';
import { useGetUnUsedChangesOptions } from '../../hooks/useGetUnUsedChangesOptions';

type Props = {
    sourceOptions: ChangesOption[];
    handleUpdate: (
        // eslint-disable-next-line no-unused-vars
        key: keyof Mapping,
        // eslint-disable-next-line no-unused-vars
        value: string | undefined,
        // eslint-disable-next-line no-unused-vars
        index: number,
    ) => void;
    rowIndex: number;
    value: string;
    isFetchingSourcePossibleFields: boolean;
    mappingArray: Mapping[];
};

const supportedOptionsTypes = [
    'text',
    'note',
    'integer',
    'decimal',
    'date',
    'start',
    'end',
    'today',
    'calculate',
    'select_one',
    'select one',
    'select_multi',
    'select multi',
    'calculate',
];

export const SourceCell: FunctionComponent<Props> = ({
    sourceOptions,
    handleUpdate,
    rowIndex,
    value,
    isFetchingSourcePossibleFields,
    mappingArray,
}) => {
    const getUnUsedOptions = useGetUnUsedChangesOptions({
        mappingKey: 'source',
        mappingArray,
        value,
    });

    const handleChange = useCallback(
        (_, newValue) => {
            handleUpdate('source', newValue, rowIndex);
        },
        [handleUpdate, rowIndex],
    );

    const options = useMemo(() => {
        let newOptions: ChangesOption[] = cloneDeep(sourceOptions);
        // only use option that are supported
        newOptions = newOptions.filter(option =>
            supportedOptionsTypes.includes(option.type),
        );
        // remove already selected options
        return getUnUsedOptions(newOptions);
    }, [getUnUsedOptions, sourceOptions]);

    return (
        <InputComponent
            withMarginTop={false}
            type="select"
            clearable={false}
            keyValue="source"
            onChange={handleChange}
            labelString=""
            required
            options={options}
            loading={isFetchingSourcePossibleFields}
            value={!isFetchingSourcePossibleFields ? value : undefined}
        />
    );
};
