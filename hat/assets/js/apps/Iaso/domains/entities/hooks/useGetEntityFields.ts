import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import { userHasPermission } from 'Iaso/domains/users/utils';
import { STORAGES } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useGetFormDescriptor } from '../../forms/fields/hooks/useGetFormDescriptor';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { Field } from '../types/fields';
import { useGetEntityTypesDropdown } from './requests';
import { useGetFields } from './useGetFields';

export const useGetEntityFields = (entity: Entity | undefined) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();

    const { data: entityTypes } = useGetEntityTypesDropdown();
    const { possibleFields } = useGetPossibleFields(
        entity?.attributes?.form_id,
    );

    const { data: formDescriptors } = useGetFormDescriptor(
        entity?.attributes?.form_id,
    );

    const detailFields = useMemo(() => {
        let fields = [];
        if (entityTypes && entity) {
            const fullType = entityTypes.find(
                type => type.value === entity.entity_type,
            );
            fields = fullType?.original?.fields_detail_info_view || [];
        }
        return fields;
    }, [entityTypes, entity]);

    const dynamicFields: Field[] = useGetFields(
        detailFields,
        entity,
        possibleFields,
        formDescriptors,
    );
    const hasPermission = userHasPermission(STORAGES, currentUser);

    const staticFields: Field[] = useMemo(() => {
        const fields: Field[] = [];

        if (hasPermission) {
            fields.push({
                label: formatMessage(MESSAGES.nfcCards),
                value: `${entity?.nfc_cards ?? 0}`,
                key: 'nfcCards',
            });
        }
        fields.push({
            label: formatMessage(MESSAGES.uuid),
            value: entity?.uuid ? `${entity.uuid}` : '--',
            key: 'uuid',
        });

        return fields;
    }, [entity?.nfc_cards, entity?.uuid, formatMessage, hasPermission]);

    return {
        isLoading: !entity || detailFields.length !== dynamicFields.length,
        fields: dynamicFields.concat(staticFields),
    };
};
