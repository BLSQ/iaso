import React, { FunctionComponent, useMemo } from 'react';
import { IconButton } from 'bluesquare-components';
import { baseUrls } from '../../../constants/urls';
import { OrgUnit } from '../types/orgUnit';
import { isValidCoordinate } from '../../../utils/map/mapUtils';
import MESSAGES from '../messages';

type Props = {
    orgUnit: OrgUnit;
};

export const ActionCell: FunctionComponent<Props> = ({ orgUnit }) => {
    const cell = useMemo(() => {
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
            </section>
        );
    }, [orgUnit.has_geo_json, orgUnit.id, orgUnit.latitude, orgUnit.longitude]);
    return cell;
};
