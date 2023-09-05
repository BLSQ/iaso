import React, { FunctionComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import { useSafeIntl } from 'bluesquare-components';
import OrgUnitPopupComponent from '../../OrgUnitPopupComponent';
import MESSAGES from '../../../messages';

type Props = {
    onClick: () => void;
    // eslint-disable-next-line no-unused-vars
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
            // @ts-ignore TODO: fix this type problem
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
