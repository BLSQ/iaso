import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { warningSnackBar } from '../../../../constants/snackBars';
import {
    closeFixedSnackbar,
    enqueueSnackbar,
} from '../../../../redux/snackBarsReducer';
import { getLatLngBounds } from '../../../../utils/map/mapUtils';

const snackbarKey = 'noInstancesOnMap';

type SetWarningParams = {
    instances: any[];
    notifications: any[];
    fetching: boolean;
};
export const useShowWarning = ({
    instances,
    notifications,
    fetching,
}: SetWarningParams): void => {
    const dispatch = useDispatch();
    const bounds = getLatLngBounds(instances);
    const isWarningDisplayed = notifications.find(n => n.id === snackbarKey);
    const shouldShowWarning =
        !fetching && instances.length === 0 && !bounds && !isWarningDisplayed;
    useEffect(() => {
        if (shouldShowWarning) {
            dispatch(enqueueSnackbar(warningSnackBar(snackbarKey)));
        } else if (bounds && isWarningDisplayed) {
            dispatch(closeFixedSnackbar(snackbarKey));
        }
        return () => {
            if (isWarningDisplayed) {
                dispatch(closeFixedSnackbar(snackbarKey));
            }
        };
    }, [bounds, dispatch, isWarningDisplayed, shouldShowWarning]);
};
