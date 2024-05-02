import { useNavigate, useLocation } from 'react-router-dom';

export const useGoBack = (
    fallBackUrl = 'home',
    nested = false,
): (() => void) => {
    const navigate = useNavigate();
    const { state, pathname } = useLocation();
    // We need different behaviour for "nested" back arrows, otherwise deep-linking will lead to circular rerouting
    const options = !nested ? { from: pathname } : null;
    if (!state) {
        return () => navigate(`/${fallBackUrl}`, { state: options });
    }
    return () => navigate(-1);
};
