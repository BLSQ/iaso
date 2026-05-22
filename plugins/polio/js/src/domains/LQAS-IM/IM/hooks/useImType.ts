import { useLocation } from 'react-router-dom';
import { baseUrls } from '../../../../constants/urls';
import { IMType } from '../../types';

type UseImTypeResult = { url: string; type: IMType };

export const useImType = (): UseImTypeResult => {
    const { pathname } = useLocation();
    if (pathname.includes(baseUrls.imGlobal)) {
        return { url: baseUrls.imGlobal, type: 'imGlobal' };
    }
    if (pathname.includes(baseUrls.imHH)) {
        return { url: baseUrls.imHH, type: 'imIHH' };
    }
    if (pathname.includes(baseUrls.imOHH)) {
        return { url: baseUrls.imOHH, type: 'imOHH' };
    }
    throw new Error(`Invalid pathname: ${pathname}`);
};
