import { useLocation } from 'react-router-dom';
import { baseUrls } from '../../../../constants/urls';

export const useImType = () => {
    const { pathname } = useLocation();
    if (pathname.includes(baseUrls.imGlobal)) {
        return { url: baseUrls.imGlobal, type: 'imGlobal' };
    }
    if (pathname.includes(baseUrls.imHH)) {
        return { url: baseUrls.imHH, type: 'imHH' };
    }
    if (pathname.includes(baseUrls.imOHH)) {
        return { url: baseUrls.imOHH, type: 'imOHH' };
    }
    throw new Error(`Invalid pathname: ${pathname}`);
};
