import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import moment from 'moment';

import {
    withStyles, TableCell, TableRow,
} from '@material-ui/core';

import GeoJsonMap from '../maps/GeoJsonMapComponent';

import MESSAGES from '../forms/messages';

const styles = theme => ({
    cell: {
        minWidth: 180,
    },
    isDifferent: {
        backgroundColor: theme.palette.error.main,
        color: 'white',
    },
});

const ignoredKeys = [
    'id',
    'source_id',
    'sub_source_id',
    'org_unit_type_id',
    'has_geo_json',
    'org_unit_type',
    'parent',
    'parent_id',
    'sub_source',
    'source',
    'source_ref',
];

const placeholder = '--';

const renderValue = (linkKey, value) => {
    if (!value || value.toString().length === 0) return placeholder;
    switch (linkKey) {
        case 'geo_json': {
            return value ? <GeoJsonMap geoJson={value} /> : placeholder;
        }
        case 'status': {
            return value
                ? (
                    <FormattedMessage
                        id="iaso.forms.validated"
                        defaultMessage="Validated"
                    />
                ) : (
                    <FormattedMessage
                        id="iaso.forms.notValidated"
                        defaultMessage="Not Validated"
                    />
                );
        }
        case 'created_at':
        case 'updated_at': {
            return moment.unix(value).format('DD/MM/YYYY HH:mm');
        }

        default:
            return value.toString();
    }
};

const LinksValue = ({
    linkKey, value, isDifferent, classes, intl,
}) => {
    const { formatMessage } = intl;
    if (ignoredKeys.indexOf(linkKey) !== -1) return null;

    return (
        <TableRow>
            <TableCell className={classes.cell}>
                {
                    MESSAGES[linkKey] && formatMessage(MESSAGES[linkKey])
                }
                {
                    !MESSAGES[linkKey] && linkKey
                }
            </TableCell>
            <TableCell className={isDifferent ? classes.isDifferent : null}>
                {renderValue(linkKey, value)}
            </TableCell>
        </TableRow>
    );
};

LinksValue.defaultProps = {
    value: null,
};

LinksValue.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    linkKey: PropTypes.string.isRequired,
    value: PropTypes.any,
    isDifferent: PropTypes.bool.isRequired,
};

export default withStyles(styles)(injectIntl(LinksValue));
