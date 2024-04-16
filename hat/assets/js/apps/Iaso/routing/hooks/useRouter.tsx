import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';

type RouterObject = {
    params: any;
    location: any;
    navigate: any;
};
// Temporary convenience hook, to replace withRouter
export const useRouter = (): RouterObject => {
    const params = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    return useMemo(() => {
        return { location, params, navigate };
    }, [location, navigate, params]);
};
