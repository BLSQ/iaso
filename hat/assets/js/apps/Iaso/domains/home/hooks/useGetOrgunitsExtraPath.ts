import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { getColor, useGetColors } from 'Iaso/hooks/useGetColors';
import { getDefaultSourceVersion } from '../../dataSources/utils';
import { locationLimitMax } from '../../orgUnits/constants/orgUnitConstants';

export const useGetOrgunitsExtraPath = (): string => {
    const currentAccount = useCurrentAccount();
    const defaultSourceVersion = getDefaultSourceVersion(currentAccount);
    const { data: colors } = useGetColors(true);
    const defaultColor = getColor(0, colors).replace('#', '');
    let sourceOrVersionParam = '';
    if (defaultSourceVersion?.version?.id) {
        sourceOrVersionParam = `,"version":${defaultSourceVersion.version.id}`;
    } else if (defaultSourceVersion?.source?.id) {
        sourceOrVersionParam = `,"source":${defaultSourceVersion.source.id}`;
    }

    return `/locationLimit/${locationLimitMax}/order/id/pageSize/20/page/1/searchTabIndex/0/searches/[{"validation_status":"VALID","color":"${defaultColor}"${sourceOrVersionParam}}]`;
};
