import { useNavigate } from 'react-router-dom';

// TODO make hook aware of whether previous location was in iaso or not (deeplinking)
export const useGoBack = (): // router?: Router,
// baseUrl?: string,
// params?: Record<string, string>,
(() => void) => {
    const navigate = useNavigate();
    // const prevPathname = useSelector(
    //     (state: State) => state.routerCustom.prevPathname,
    // );
    // const dispatch = useDispatch();
    // if (prevPathname) {
    //     return () => router?.goBack();
    // }
    // return () => dispatch(redirectToReplace(baseUrl || '', params || {}));
    return () => navigate(-1);
};
