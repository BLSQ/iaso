import {
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useRedirectToReplace } from 'bluesquare-components';
import { Optional } from '../types/utils';

type UseTabsParams<T> = {
    params?: Record<string, Optional<string>>;
    defaultTab: T;
    baseUrl?: string;
};

// T should be a union type of the possible string values for the Tabs
type UseTabsValue<T> = {
    tab: T;
    setTab: Dispatch<SetStateAction<T>>;
    handleChangeTab: (_event: any, newTab: T) => void;
};

export const useTabs = <T,>({
    params,
    defaultTab,
    baseUrl,
}: UseTabsParams<T>): UseTabsValue<T> => {
    const redirectToReplace = useRedirectToReplace();
    const [tab, setTab] = useState<T>(defaultTab);

    const handleChangeTab = useCallback(
        (_event, newTab) => {
            if (baseUrl && params) {
                const newParams = {
                    ...params,
                    tab: newTab,
                };
                redirectToReplace(baseUrl, newParams);
            }
            setTab(newTab);
        },
        [params, redirectToReplace, baseUrl],
    );
    return useMemo(
        () => ({ tab, setTab, handleChangeTab }),
        [handleChangeTab, tab],
    );
};
