import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useGoBack = (
    fallBackUrl = 'home',
    nested = false,
): (() => void) => {
    const navigate = useNavigate();
    const { state, pathname } = useLocation();
    // We need different behaviour for "nested" back arrows, otherwise deep-linking will lead to circular rerouting
    return useCallback(() => {
        const options = !nested ? { location: pathname } : null;
        if (!state) {
            navigate(`/${fallBackUrl}`, { state: options });
        } else {
            navigate(-1);
        }
    }, [fallBackUrl, navigate, nested, pathname, state]);
};
