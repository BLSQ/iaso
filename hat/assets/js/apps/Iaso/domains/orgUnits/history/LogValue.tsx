import React, { FunctionComponent, useState } from 'react';
import { makeStyles } from '@mui/styles';
import { wktToGeoJSON as terraformer } from '@terraformer/wkt';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';

import { GeoJsonMap } from 'Iaso/components/maps/GeoJsonMapComponent';
import { MarkerMap } from 'Iaso/components/maps/MarkerMapComponent';
import { GeoJson } from 'Iaso/components/maps/types';
import { LinkToOrgUnit } from '../components/LinkToOrgUnit';
import { useGetOrgUnitDetail } from '../hooks/requests/useGetOrgUnitDetail';

import { MESSAGES } from './messages';

type Props = {
    fieldKey: string;
    value?: any;
};

export const wktToGeoJSON = (value: string | number): GeoJson | undefined => {
    return terraformer(value.toString().replace('SRID=4326;', ''));
};

const styles = theme => ({
    cellMap: {
        margin: -theme.spacing(2),
    },
});

const useStyles = makeStyles(styles);

export const LogValue: FunctionComponent<Props> = ({ fieldKey, value }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [parentOrgUnitId, setParentOrgUnitId] = useState<
        undefined | number
    >();
    const { data: parentOrgUnit, isFetching: isFetchingOrgUnit } =
        useGetOrgUnitDetail(parentOrgUnitId);
    if (!value || value === '') return textPlaceholder;
    try {
        switch (fieldKey) {
            case 'geom':
            case 'catchment':
            case 'simplified_geom': {
                const geoJson: GeoJson | undefined = wktToGeoJSON(value);
                if (!geoJson) return textPlaceholder;
                return (
                    <div className={classes.cellMap}>
                        <GeoJsonMap geoJson={geoJson} />
                    </div>
                );
            }

            case 'validation_status': {
                return MESSAGES[value] ? formatMessage(MESSAGES[value]) : value;
            }
            case 'updated_at': {
                return moment(value).format('LTS');
            }

            case 'parent': {
                if (value !== parentOrgUnitId) {
                    setParentOrgUnitId(value as number);
                }
                if (parentOrgUnit && !isFetchingOrgUnit) {
                    return <LinkToOrgUnit orgUnit={parentOrgUnit} />;
                }
                return '';
            }
            case 'location': {
                const geoJson: GeoJson | undefined = wktToGeoJSON(value);
                if (!geoJson || !geoJson?.coordinates) return textPlaceholder;
                const { coordinates } = geoJson;
                return (
                    <div className={classes.cellMap}>
                        <MarkerMap
                            longitude={coordinates[0]}
                            latitude={coordinates[1]}
                        />
                    </div>
                );
            }
            case 'org_unit_type':
                return `${value.name} (id: ${value.id})`;
            default:
                return value.toString();
        }
    } catch (e) {
        console.error('Could not parse', e);
        throw new Error(value.toString());
    }
};
