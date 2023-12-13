import {
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useDispatch } from 'react-redux';
import { redirectToReplace } from '../routing/actions';
import { Optional } from '../types/utils';

type UseTabsParams<T> = {
    params: Record<string, Optional<string>>;
    defaultTab: T;
    baseUrl: string;
};

// T should be a union type of the possible string values for the Tabs
type UseTabsValue<T> = {
    tab: T;
    setTab: Dispatch<SetStateAction<T>>;
    // eslint-disable-next-line no-unused-vars
    handleChangeTab: (_event: any, newTab: T) => void;
};

export const useTabs = <T,>({
    params,
    defaultTab,
    baseUrl,
}: UseTabsParams<T>): UseTabsValue<T> => {
    const dispatch = useDispatch();
    const [tab, setTab] = useState<T>(defaultTab);

    const handleChangeTab = useCallback(
        (_event, newTab) => {
            const newParams = {
                ...params,
                tab: newTab,
            };
            dispatch(redirectToReplace(baseUrl, newParams));
            setTab(newTab);
        },
        [params, dispatch, baseUrl],
    );
    return useMemo(
        () => ({ tab, setTab, handleChangeTab }),
        [handleChangeTab, tab],
    );
};
