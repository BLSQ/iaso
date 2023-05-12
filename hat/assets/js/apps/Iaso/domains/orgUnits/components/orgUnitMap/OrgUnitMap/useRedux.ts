import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { resetMapReducer as resetMapReducerAction } from '../../../../../redux/mapReducer';
import { setCurrentSubOrgUnit as setCurrentSubOrgUnitAction } from '../../../actions';
import { setCurrentInstance as setCurrentInstanceAction } from '../../../../instances/actions';
import {
    fetchOrgUnitDetail,
    fetchInstanceDetail as fetchInstanceDetailRequest,
} from '../../../../../utils/requests';

export const useRedux = () => {
    const dispatch = useDispatch();
    const setCurrentSubOrgUnit = useCallback(
        o => dispatch(setCurrentSubOrgUnitAction(o)),
        [dispatch],
    );

    const setCurrentInstance = useCallback(
        i => dispatch(setCurrentInstanceAction(i)),
        [dispatch],
    );

    const resetMapReducer = useCallback(
        () => dispatch(resetMapReducerAction()),
        [dispatch],
    );
    const fetchSubOrgUnitDetail = useCallback(
        orgUnit => {
            setCurrentSubOrgUnit(null);
            fetchOrgUnitDetail(dispatch, orgUnit.id).then(subOrgUnit =>
                setCurrentSubOrgUnit(subOrgUnit),
            );
        },
        [dispatch, setCurrentSubOrgUnit],
    );

    const fetchInstanceDetail = useCallback(
        instance => {
            setCurrentInstance(null);
            fetchInstanceDetailRequest(dispatch, instance.id).then(i =>
                setCurrentInstance(i),
            );
        },
        [dispatch, setCurrentInstance],
    );

    return {
        resetMapReducer,
        fetchSubOrgUnitDetail,
        fetchInstanceDetail,
    };
};
