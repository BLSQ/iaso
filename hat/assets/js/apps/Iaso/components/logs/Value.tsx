import React,  {FunctionComponent} from 'react';
import { wktToGeoJSON as terraformer } from '@terraformer/wkt';
// @ts-ignore
import { textPlaceholder } from 'bluesquare-components';
import moment from 'moment';
import { makeStyles } from '@material-ui/core';

import { GeoJsonMap } from '../maps/GeoJsonMapComponent';
import { MarkerMap } from '../maps/MarkerMapComponent';
import { GeoJson } from '../maps/types';


type Props = {
    fieldKey: string;
    value?: string | number;
};

const wktToGeoJSON = (value: string | number):GeoJson | undefined  => {
    return terraformer(value.toString().replace('SRID=4326;', ''));
};

const styles = theme => ({
    cellMap: {
        margin: -theme.spacing(2),
    },
});

const useStyles = makeStyles(styles);

export const Value: FunctionComponent<Props> = ({fieldKey, value}) => {
    const classes = useStyles();
    if (!value || value.toString().length === 0) return textPlaceholder;
    try {
        switch (fieldKey) {
            case 'geom':
            case 'catchment':
            case 'simplified_geom': {
                const geoJson:GeoJson | undefined= wktToGeoJSON(value);
                if (!geoJson) return textPlaceholder;
                return (
                    <div className={classes.cellMap}>
                        <GeoJsonMap geoJson={geoJson} />
                    </div>
                );
            }

            case 'updated_at': {
                return moment(value).format('LTS');
            }

            case 'location': {
                const geoJson:GeoJson | undefined = wktToGeoJSON(value);
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
            default:
                return value.toString();
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Could not parse', e);
        throw new Error(
            value.toString(),
        );
    }
};
