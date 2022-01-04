import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { TableCell, TableRow } from '@material-ui/core';

import { useStyles } from './Styles';
import MESSAGES from '../../constants/messages';
import { colsCount, colSpanTitle, staticFields } from './constants';

const PlaceholderRow = ({ loadingCampaigns }) => {
    const classes = useStyles();
    return (
        <TableRow className={classes.tableRow}>
            <TableCell
                className={classes.noCampaign}
                colSpan={colsCount * 7 + staticFields.length * colSpanTitle}
            >
                {!loadingCampaigns && (
                    <FormattedMessage {...MESSAGES.noCampaign} />
                )}
            </TableCell>
        </TableRow>
    );
};

PlaceholderRow.propTypes = {
    loadingCampaigns: PropTypes.bool.isRequired,
};

export { PlaceholderRow };
