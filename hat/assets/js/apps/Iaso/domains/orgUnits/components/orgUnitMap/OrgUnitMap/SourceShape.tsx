import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import MESSAGES from '../../../messages';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';

type Props = {
    replaceLocation: (orgUnit: any) => void;
    source: any;
    shape: any;
};

export const SourceShape: FunctionComponent<Props> = ({
    source,
    shape,
    replaceLocation,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <GeoJSON
            style={{
                color: source.color,
            }}
            data={shape.geo_json}
        >
            <OrgUnitPopupComponent
                titleMessage={formatMessage(MESSAGES.ouLinked)}
                displayUseLocation
                replaceLocation={replaceLocation}
                orgUnitId={shape.id}
            />
        </GeoJSON>
    );
};
