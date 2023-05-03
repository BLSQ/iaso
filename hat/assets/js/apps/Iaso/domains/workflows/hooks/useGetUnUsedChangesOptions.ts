import { useCallback } from 'react';
import { cloneDeep } from 'lodash';

import { ChangesOption, Mapping } from '../types';

type getUnUsedOptionsProps = {
    mappingKey: 'source' | 'target';
    mappingArray: Mapping[];
    value: string;
};
export const useGetUnUsedChangesOptions = ({
    mappingKey,
    mappingArray,
    value,
}: // eslint-disable-next-line no-unused-vars
getUnUsedOptionsProps): ((options: ChangesOption[]) => ChangesOption[]) => {
    const getUnUsedOptions = useCallback(
        (options: ChangesOption[]) => {
            const newOptions: ChangesOption[] = cloneDeep(options).filter(
                option => {
                    // display selected value in option list
                    if (value === option.value) {
                        return true;
                    }
                    // if option is not already present in the mapping
                    if (
                        !mappingArray.find(
                            mapping => mapping[mappingKey] === option.value,
                        )
                    ) {
                        return true;
                    }
                    return false;
                },
            );
            return newOptions;
        },
        [mappingArray, mappingKey, value],
    );
    return getUnUsedOptions;
};
