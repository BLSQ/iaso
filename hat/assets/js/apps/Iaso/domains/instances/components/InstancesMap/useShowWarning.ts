import { closeSnackbar } from 'notistack';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { warningSnackBar } from '../../../../constants/snackBars';
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
            openSnackBar(warningSnackBar(snackbarKey));
        } else if (bounds && isWarningDisplayed) {
            closeSnackbar(snackbarKey);
        }
        return () => {
            if (isWarningDisplayed) {
                closeSnackbar(snackbarKey);
            }
        };
    }, [bounds, dispatch, isWarningDisplayed, shouldShowWarning]);
};
