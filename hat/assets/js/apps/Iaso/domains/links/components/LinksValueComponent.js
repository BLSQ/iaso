import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import { makeStyles, TableCell, TableRow } from '@material-ui/core';

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

export const LinksValue = ({
    linkKey,
    value,
    link,
    isDifferent,
    validated,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    if (ignoredKeys.indexOf(linkKey) !== -1) return null;

    const differentClass = validated
        ? classes.isDifferentValidated
        : classes.isDifferent;
    return (
        <TableRow>
            <TableCell className={classes.cell}>
                {MESSAGES[linkKey] && formatMessage(MESSAGES[linkKey])}
                {!MESSAGES[linkKey] && linkKey}
            </TableCell>
            <TableCell className={isDifferent ? differentClass : null}>
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

LinksValue.defaultProps = {
    value: null,
    link: null,
    validated: false,
};

LinksValue.propTypes = {
    linkKey: PropTypes.string.isRequired,
    value: PropTypes.any,
    link: PropTypes.any,
    isDifferent: PropTypes.bool.isRequired,
    validated: PropTypes.bool,
};
