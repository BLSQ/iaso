import {
    type ApiV2OrgunittypesDropdownListParams,
    useApiV2OrgunittypesDropdownList,
} from 'Iaso/api/orgUnitTypes';
import { useCheckUserHasWriteTypePermission } from '../../../../utils/usersUtils';

type Props = {
    params?: ApiV2OrgunittypesDropdownListParams;
    onlyWriteAccess?: boolean;
    enabled?: boolean;
};
export const useGetOrgUnitTypesDropdownOptions = ({
    params = {},
    onlyWriteAccess = false,
    enabled = true,
}: Props = {}): ReturnType<typeof useApiV2OrgunittypesDropdownList> => {
    const checkUserHasWriteTypePermission =
        useCheckUserHasWriteTypePermission();

    return useApiV2OrgunittypesDropdownList(
        { ...params, order: 'depth' },
        {
            query: {
                enabled: enabled,
                select: data => {
                    if (!data) return [];
                    let orgUnitTypes = [...data];
                    if (onlyWriteAccess) {
                        orgUnitTypes = orgUnitTypes.filter(orgunitType =>
                            checkUserHasWriteTypePermission(orgunitType.value),
                        );
                    }
                    return orgUnitTypes;
                },
            },
        },
    );
};
