import { DataSource } from 'Iaso/utils/usersUtils';
import { openSnackBar } from '../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../constants/snackBars';
import { getRequest } from '../../libs/Api';
import { OrgUnit } from './types/orgUnit';

export type ExtendedDataSource = DataSource & {
    orgUnits: OrgUnit[];
};

/** @deprecated */
/** @description Don't use in new code */
export const fetchAssociatedOrgUnits = (
    source: DataSource,
    orgUnit: OrgUnit,
    fitToBounds = () => null,
): Promise<ExtendedDataSource> => {
    const url = `/api/orgunits/?linkedTo=${orgUnit.id}&linkValidated=all&linkSource=${source.id}&validation_status=all&withShapes=true`;

    return getRequest(url)
        .then(data => {
            fitToBounds();
            return {
                ...source,
                orgUnits: data.orgUnits,
            };
        })
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitsError', null, error));
            console.error('Error while fetching org unit list:', error);
            return { ...source, orgUnits: [] };
        });
};
