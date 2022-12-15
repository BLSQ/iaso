import { useDispatch, useSelector } from 'react-redux';

import { baseUrls } from '../constants/urls';

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
export const useGoBack = (router: Router): (() => void) => {
    const prevPathname = useSelector(
        (state: State) => state.routerCustom.prevPathname,
    );
    const dispatch = useDispatch();
    if (prevPathname) {
        return () => router.goBack();
    }
    return () => dispatch(redirectToReplace(baseUrls.entityTypes, {}));
};
