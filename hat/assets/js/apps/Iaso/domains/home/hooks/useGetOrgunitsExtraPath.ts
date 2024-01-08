import { getChipColors } from '../../../constants/chipColors';
import { useCurrentUser } from '../../../utils/usersUtils';
import { getDefaultSourceVersion } from '../../dataSources/utils';
import { locationLimitMax } from '../../orgUnits/constants/orgUnitConstants';

export const useGetOrgunitsExtraPath = (): string => {
    const currentUser = useCurrentUser();
    const defaultSourceVersionId =
        getDefaultSourceVersion(currentUser)?.source?.id;
    return `/locationLimit/${locationLimitMax}/order/id/pageSize/20/page/1/searchTabIndex/0/searches/[{"validation_status":"all","color":"${getChipColors(
        0,
    ).replace('#', '')}"${
        defaultSourceVersionId ? `,"source":${defaultSourceVersionId}` : ''
    }}]`;
};
