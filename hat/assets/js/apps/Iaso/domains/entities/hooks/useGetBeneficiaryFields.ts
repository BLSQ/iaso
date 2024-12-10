import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';

import { useGetFormDescriptor } from '../../forms/fields/hooks/useGetFormDescriptor';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import MESSAGES from '../messages';
import { Beneficiary } from '../types/beneficiary';
import { Field } from '../types/fields';
import { useGetBeneficiaryTypesDropdown } from './requests';
import { useGetFields } from './useGetFields';

export const useGetBeneficiaryFields = (
    beneficiary: Beneficiary | undefined,
) => {
    const { formatMessage } = useSafeIntl();

    const { data: beneficiaryTypes } = useGetBeneficiaryTypesDropdown();
    const { possibleFields } = useGetPossibleFields(
        beneficiary?.attributes?.form_id,
    );

    const { data: formDescriptors } = useGetFormDescriptor(
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
        formDescriptors,
    );

    const staticFields: Field[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.nfcCards),
                value: `${beneficiary?.nfc_cards ?? 0}`,
                key: 'nfcCards',
            },
            {
                label: formatMessage(MESSAGES.uuid),
                value: beneficiary?.uuid ? `${beneficiary.uuid}` : '--',
                key: 'uuid',
            },
        ],
        [beneficiary?.nfc_cards, beneficiary?.uuid, formatMessage],
    );

    return {
        isLoading: !beneficiary || detailFields.length !== dynamicFields.length,
        fields: dynamicFields.concat(staticFields),
    };
};
