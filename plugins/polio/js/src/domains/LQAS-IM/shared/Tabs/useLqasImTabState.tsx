import { useCallback, useMemo, useState } from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { Side, Sides } from '../../../../constants/types';
import { MAP } from '../constants';

type TabValue = 'map' | 'list';

type Args = {
    baseUrl: string;
    params: Record<string, string | undefined>;
    side: Side;
};

export const useLqasImTabState = ({
    baseUrl,
    params,
    side,
}: Args): { tab: TabValue; handleChangeTab: (newTab: TabValue) => void } => {
    const redirectToReplace = useRedirectToReplace();
    const paramTab =
        side === Sides.left
            ? (params.leftTab as 'map' | 'list' | undefined)
            : (params.rightTab as 'map' | 'list' | undefined);

    const [tab, setTab] = useState<'map' | 'list'>(paramTab ?? MAP);

    const handleChangeTab = useCallback(
        newtab => {
            const tabKey = side === Sides.left ? 'leftTab' : 'rightTab';
            setTab(newtab);
            const newParams = {
                ...params,
                [tabKey]: newtab,
            };
            redirectToReplace(baseUrl, newParams);
        },
        [side, params, redirectToReplace, baseUrl],
    );

    return useMemo(() => {
        return {
            tab,
            handleChangeTab,
        };
    }, [handleChangeTab, tab]);
};
