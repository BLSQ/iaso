import React, { FunctionComponent } from 'react';
import { makeStyles } from '@mui/styles';
// ts complaints about the import of moment for some reason
// @ts-ignore
import moment from 'moment';
// @ts-ignore
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { GeoJsonMap } from '../../../components/maps/GeoJsonMapComponent';
import { getOrgUnitParentsString } from '../../orgUnits/utils';
import { MESSAGES } from '../messages';

const useStyles = makeStyles(theme => ({
    cellMap: {
        margin: -theme.spacing(2),
    },
}));

type Props = {
    linkKey: string;
    value?: any;
    link?: any;
};

export const LinkValue: FunctionComponent<Props> = ({
    linkKey,
    value = null,
    link = null,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    if (!value || value.toString().length === 0) return textPlaceholder;
    switch (linkKey) {
        case 'geo_json': {
            return (
                <div className={classes.cellMap}>
                    <GeoJsonMap geoJson={value} />
                </div>
            );
        }
        case 'status': {
            return value
                ? formatMessage(MESSAGES.validated)
                : formatMessage(MESSAGES.notValidated);
        }
        case 'groups': {
            return value.map(g => g.name).join(', ');
        }
        case 'created_at':
        case 'updated_at': {
            return moment.unix(value).format('LTS');
        }
        case 'parent': {
            return getOrgUnitParentsString(link);
        }

        default:
            return value.toString();
    }
};
