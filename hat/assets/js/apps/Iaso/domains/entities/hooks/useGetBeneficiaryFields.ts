import { useMemo } from 'react';

import { Field } from '../types/fields';
import { PossibleField } from '../../forms/types/forms';

import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import { useGetFields } from './useGetFields';
import { useGetBeneficiaryTypesDropdown } from './requests';

export const useGetBeneficiaryFields = beneficiary => {
    console.log('useGetBeneficiary', beneficiary);
    const { data: beneficiaryTypes } = useGetBeneficiaryTypesDropdown();
    const { possibleFields } = useGetPossibleFields(
        beneficiary?.attributes?.form_id,
    );

    const detailFields = useMemo(() => {
        let fields = [];
        if (beneficiaryTypes && beneficiary) {
            const fullType = beneficiaryTypes.find(
                type => type.value === beneficiary.entity_type,
            );
            fields = fullType?.original?.fields_detail_info_view || [];
        }
        return fields;
    }, [beneficiaryTypes, beneficiary]);
    const dynamicFields: Field[] = useGetFields(
        detailFields,
        beneficiary,
        possibleFields,
    );

    const isLoading =
        !beneficiary || detailFields.length !== dynamicFields.length;

    return { isLoading, dynamicFields };
};
