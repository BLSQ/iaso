import { useNavigate, useLocation } from 'react-router-dom';

export const useGoBack = (fallBackUrl = 'home'): (() => void) => {
    const navigate = useNavigate();
    const { state, pathname } = useLocation();
    if (!state) {
        return () => navigate(`/${fallBackUrl}`, { state: { from: pathname } });
    }
    return () => navigate(-1);
};
