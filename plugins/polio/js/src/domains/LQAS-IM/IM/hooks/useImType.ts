import { useLocation } from 'react-router-dom';
import { baseUrls } from '../../../../constants/urls';

export const useImType = () => {
    const { pathname } = useLocation();
    if (pathname.includes(baseUrls.imGlobal)) {
        return { url: baseUrls.imGlobal, type: 'imGlobal' };
    }
    if (pathname.includes(baseUrls.imIhh)) {
        return { url: baseUrls.imIhh, type: 'imIHH' };
    }
    if (pathname.includes(baseUrls.imOhh)) {
        return { url: baseUrls.imOhh, type: 'imOHH' };
    }
    throw new Error(`Invalid pathname: ${pathname}`);
};
