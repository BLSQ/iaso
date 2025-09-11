import React, { FunctionComponent, useCallback } from 'react';
import { useGetForm } from 'Iaso/domains/forms/requests';
import { PossibleField } from 'Iaso/domains/forms/types/forms';
import { Instance } from '../types/instance';
import { formatLabel } from '../utils';
import InstanceDetailsField from './InstanceDetailsField';

type Props = {
    currentInstance?: Instance;
};

export const InstancesLabelKeys: FunctionComponent<Props> = ({
    currentInstance,
}) => {
    const { data: currentForm, isFetching: isFetchingForm } = useGetForm(
        currentInstance?.form_id,
        undefined,
        'name,label_keys,id,possible_fields',
    );
    const getLabelKeyLabel = useCallback(
        (labelKey: string) => {
            if (isFetchingForm) {
                return '';
            }
            const possibleField = currentForm?.possible_fields.find(
                (field: PossibleField) => field.name === labelKey,
            );
            if (possibleField) {
                return formatLabel(possibleField);
            }
            return labelKey;
        },
        [currentForm, isFetchingForm],
    );
    return (
        <>
            {currentForm?.label_keys.slice(0, 10).map((labelKey: string) => (
                <InstanceDetailsField
                    key={labelKey}
                    label={getLabelKeyLabel(labelKey)}
                    value={currentInstance?.file_content[labelKey]}
                />
            ))}
        </>
    );
};
