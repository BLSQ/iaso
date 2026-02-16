import React, { FunctionComponent, useMemo } from 'react';
import { IconButton } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { isValidCoordinate } from '../../../utils/map/mapUtils';
import { useSaveOrgUnit } from '../hooks';
import MESSAGES from '../messages';
import { OrgUnit } from '../types/orgUnit';

type Props = {
    orgUnit: OrgUnit;
};

export const ActionCell: FunctionComponent<Props> = ({ orgUnit }) => {
    const { mutateAsync: saveOu, isLoading: isSaving } = useSaveOrgUnit(
        undefined,
        ['orgunits'],
        MESSAGES.validationStatusChanged,
    );

    const cell = useMemo(() => {
        const handleRejectOrgUnit = () => {
            saveOu({
                id: orgUnit.id,
                validation_status: 'REJECTED',
                groups: orgUnit.groups.map(g => g.id),
            });
        };

        return (
            <section>
                <IconButton
                    url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/infos`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
                {(orgUnit.has_geo_json ||
                    isValidCoordinate(orgUnit.latitude, orgUnit.longitude)) && (
                    <IconButton
                        url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/map`}
                        icon="map"
                        tooltipMessage={MESSAGES.map}
                    />
                )}

                <IconButton
                    url={`/${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/history`}
                    icon="history"
                    tooltipMessage={MESSAGES.history}
                />
                <IconButton
                    onClick={handleRejectOrgUnit}
                    icon="delete"
                    tooltipMessage={MESSAGES.rejectOrgUnit}
                    disabled={isSaving}
                />
            </section>
        );
    }, [
        orgUnit.id,
        orgUnit.has_geo_json,
        orgUnit.latitude,
        orgUnit.longitude,
        orgUnit.groups,
        isSaving,
        saveOu,
    ]);
    return cell;
};
