import { useSafeIntl } from 'bluesquare-components';
import React, { FunctionComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import MESSAGES from '../../../messages';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';

type Props = {
    onClick: () => void;
    replaceLocation: (orgUnit: any) => void;
    source: any;
    shape: any;
};

export const SourceShape: FunctionComponent<Props> = ({
    source,
    shape,
    onClick,
    replaceLocation,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <GeoJSON
            style={{
                color: source.color,
            }}
            data={shape.geo_json}
            eventHandlers={{
                click: onClick,
            }}
        >
            <OrgUnitPopupComponent
                titleMessage={formatMessage(MESSAGES.ouLinked)}
                displayUseLocation
                replaceLocation={replaceLocation}
            />
        </GeoJSON>
    );
};
