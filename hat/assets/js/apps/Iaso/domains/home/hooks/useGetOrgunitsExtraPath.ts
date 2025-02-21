import { getChipColors } from '../../../constants/chipColors';
import { useCurrentUser } from '../../../utils/usersUtils';
import { getDefaultSourceVersion } from '../../dataSources/utils';
import { locationLimitMax } from '../../orgUnits/constants/orgUnitConstants';

export const useGetOrgunitsExtraPath = (): string => {
    const currentUser = useCurrentUser();
    const defaultSourceVersion = getDefaultSourceVersion(currentUser);

    let sourceOrVersionParam = '';
    if (defaultSourceVersion?.version?.id) {
        sourceOrVersionParam = `,"version":${defaultSourceVersion.version.id}`;
    } else if (defaultSourceVersion?.source?.id) {
        sourceOrVersionParam = `,"source":${defaultSourceVersion.source.id}`;
    }

    return `/locationLimit/${locationLimitMax}/order/id/pageSize/20/page/1/searchTabIndex/0/searches/[{"validation_status":"all","color":"${getChipColors(
        0,
    ).replace('#', '')}"${sourceOrVersionParam}}]`;
};
