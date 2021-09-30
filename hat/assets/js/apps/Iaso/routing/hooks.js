import { useDispatch } from 'react-redux';
import { replace } from 'react-router-redux';

export const useReplace = () => {
    const dispatch = useDispatch();
    return url => dispatch(replace(url));
};
