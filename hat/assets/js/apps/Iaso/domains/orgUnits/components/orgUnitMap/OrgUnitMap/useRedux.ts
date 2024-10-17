import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { fetchOrgUnitDetail } from '../../../../../utils/requests';
import { setCurrentSubOrgUnit as setCurrentSubOrgUnitAction } from '../../../actions';

export const useRedux = () => {
    const dispatch = useDispatch();
    const setCurrentSubOrgUnit = useCallback(
        o => dispatch(setCurrentSubOrgUnitAction(o)),
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

    return {
        fetchSubOrgUnitDetail,
    };
};
