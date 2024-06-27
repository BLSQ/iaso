import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
    fetchInstanceDetail as fetchInstanceDetailRequest,
    fetchOrgUnitDetail,
} from '../../../../../utils/requests';
import { setCurrentInstance as setCurrentInstanceAction } from '../../../../instances/actions';
import { setCurrentSubOrgUnit as setCurrentSubOrgUnitAction } from '../../../actions';

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

    const fetchSubOrgUnitDetail = useCallback(
        orgUnit => {
            setCurrentSubOrgUnit(null);
            fetchOrgUnitDetail(orgUnit.id).then(subOrgUnit =>
                setCurrentSubOrgUnit(subOrgUnit),
            );
        },
        [setCurrentSubOrgUnit],
    );

    const fetchInstanceDetail = useCallback(
        instance => {
            setCurrentInstance(null);
            fetchInstanceDetailRequest(instance.id).then(i =>
                setCurrentInstance(i),
            );
        },
        [setCurrentInstance],
    );

    return {
        fetchSubOrgUnitDetail,
        fetchInstanceDetail,
    };
};
