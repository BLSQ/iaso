import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

const useFetchOnMount = promisesArray => {
    const dispatch = useDispatch();
    useEffect(() => {
        promisesArray.forEach(p => {
            p.setFetching(true);
            p.fetch(...[dispatch, ...(p.args ?? [])]).then(data => {
                p.setFetching(false);
                p.setData && dispatch(p.setData(data));
            });
        });
    }, []);
};

export { useFetchOnMount };
