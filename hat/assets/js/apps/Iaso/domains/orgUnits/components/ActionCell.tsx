import React, { FunctionComponent, useMemo } from 'react';
import {
    // @ts-ignore
    IconButton as IconButtonComponent,
} from 'bluesquare-components';

import MESSAGES from '../messages';
import { baseUrls } from '../../../constants/urls';
import { OrgUnit } from '../types/orgUnit';
import { isValidCoordinate } from '../../../utils/map/mapUtils';

type Props = {
    orgUnit: OrgUnit;
};

export const ActionCell: FunctionComponent<Props> = ({ orgUnit }) => {
    const cell = useMemo(() => {
        return (
            <section>
                <IconButtonComponent
                    url={`${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/infos`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.details}
                />
                {(orgUnit.has_geo_json ||
                    isValidCoordinate(orgUnit.latitude, orgUnit.longitude)) && (
                    <IconButtonComponent
                        url={`${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/map`}
                        icon="map"
                        tooltipMessage={MESSAGES.map}
                    />
                )}

                <IconButtonComponent
                    url={`${baseUrls.orgUnitDetails}/orgUnitId/${orgUnit.id}/tab/history`}
                    icon="history"
                    tooltipMessage={MESSAGES.history}
                />
            </section>
        );
    }, [orgUnit.has_geo_json, orgUnit.id, orgUnit.latitude, orgUnit.longitude]);
    return cell;
};
