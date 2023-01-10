import React, { FunctionComponent } from 'react';
import { makeStyles, TableCell, TableRow } from '@material-ui/core';
// ts complaints about the import of moment for some reason
// @ts-ignore
import moment from 'moment';
// @ts-ignore
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';
import GeoJsonMap from '../../../components/maps/GeoJsonMapComponent';
import { getOrgUnitParentsString } from '../../orgUnits/utils';

import MESSAGES from '../../forms/messages';
import { MESSAGES as LINKS_MESSAGES } from '../messages';

const useStyles = makeStyles(theme => ({
    cell: {
        minWidth: 180,
    },
    isDifferent: {
        backgroundColor: theme.palette.secondary.main,
        color: 'white',
    },
    isDifferentValidated: {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
    },
    cellMap: {
        margin: -theme.spacing(2),
    },
}));

const ignoredKeys = [
    'id',
    'source_id',
    'sub_source_id',
    'org_unit_type_id',
    'has_geo_json',
    'org_unit_type',
    'parent_id',
    'sub_source',
    'source',
];

const LinkValue = ({ linkKey, link, value, classes }) => {
    const { formatMessage } = useSafeIntl();
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
                ? formatMessage(LINKS_MESSAGES.validated)
                : formatMessage(LINKS_MESSAGES.notValidated);
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

type Props = {
    linkKey: string;
    value?: any;
    link?: any;
    isDifferent: boolean;
    validated?: boolean;
};

export const LinksValue: FunctionComponent<Props> = ({
    linkKey,
    value = null,
    link = null,
    isDifferent,
    validated = false,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    if (ignoredKeys.indexOf(linkKey) !== -1) return null;

    const differentClass = validated
        ? classes.isDifferentValidated
        : classes.isDifferent;

    const className = isDifferent ? differentClass : undefined;

    return (
        <TableRow>
            <TableCell className={classes.cell}>
                {MESSAGES[linkKey] && formatMessage(MESSAGES[linkKey])}
                {!MESSAGES[linkKey] && linkKey}
            </TableCell>
            <TableCell className={className}>
                <LinkValue
                    linkKey={linkKey}
                    value={value}
                    classes={classes}
                    link={link}
                />
            </TableCell>
        </TableRow>
    );
};
