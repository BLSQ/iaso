import { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { resetMapReducer } from '../../../../redux/mapReducer';

export const useResetMapReducerOnUnmount = (): void => {
    const dispatch = useDispatch();
    const reset = useMemo(() => {
        return () => dispatch(resetMapReducer());
    }, [dispatch]);
    useEffect(() => {
        return () => {
            reset();
        };
    }, [reset]);
};
