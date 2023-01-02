import { useDispatch, useSelector } from 'react-redux';

import { redirectToReplace } from './actions';

type RouterCustom = {
    prevPathname: string | undefined;
};
type Router = {
    goBack: () => void;
};
type State = {
    routerCustom: RouterCustom;
};
export const useGoBack = (
    router: Router,
    baseUrl: string,
    params?: Record<string, string>,
): (() => void) => {
    const prevPathname = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();
    if (prevPathname) {
        return () => router.goBack();
    }
    return () => dispatch(redirectToReplace(baseUrl, params || {}));
};
