import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';

import {
    useCurrentUserHasAccessToModule,
    useCurrentUserHasPermission,
} from 'Iaso/domains/users/utils';
import { MODULE_EXTERNAL_STORAGE } from 'Iaso/utils/modules';
import { STORAGES } from 'Iaso/utils/permissions';
import { useGetFormDescriptor } from '../../forms/fields/hooks/useGetFormDescriptor';
import { useGetPossibleFields } from '../../forms/hooks/useGetPossibleFields';
import MESSAGES from '../messages';
import { Entity } from '../types/entity';
import { Field } from '../types/fields';
import { useGetEntityTypesDropdown } from './requests';
import { useGetFields } from './useGetFields';

export const useGetEntityFields = (entity: Entity | undefined) => {
    const { formatMessage } = useSafeIntl();

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

    const hasExternalStorageAccess = useCurrentUserHasAccessToModule(
        MODULE_EXTERNAL_STORAGE,
    );
    const hasPermission = useCurrentUserHasPermission(STORAGES);

    const staticFields: Field[] = useMemo(() => {
        const fields: Field[] = [];

        if (hasExternalStorageAccess && hasPermission) {
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
    }, [
        entity?.nfc_cards,
        entity?.uuid,
        formatMessage,
        hasExternalStorageAccess,
        hasPermission,
    ]);

    return {
        isLoading: !entity || detailFields.length !== dynamicFields.length,
        fields: dynamicFields.concat(staticFields),
    };
};
