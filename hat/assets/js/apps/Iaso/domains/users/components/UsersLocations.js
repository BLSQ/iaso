import React from 'react';
import PropTypes from 'prop-types';
import { Chip, makeStyles, Box, Typography } from '@material-ui/core';
import orderBy from 'lodash/orderBy';
import { FormattedMessage } from 'react-intl';

import OrgUnitSearch from '../../orgUnits/components/OrgUnitSearch';
import OrgUnitTooltip from '../../orgUnits/components/OrgUnitTooltip';
import { getOrgunitMessage } from '../../orgUnits/utils';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    chipList: {
        marginTop: theme.spacing(2),
    },
    chipListTitle: {
        marginBottom: theme.spacing(1),
    },
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
}));

const UsersLocations = ({ handleChange, currentUser }) => {
    const classes = useStyles();
    const handleDelete = ou => {
        const orgUnitsList = [...currentUser.org_units.value];
        const currentOuIndex = orgUnitsList.findIndex(o => o.id === ou.id);
        orgUnitsList.splice(currentOuIndex, 1);
        handleChange(orgUnitsList);
    };
    const handleAdd = ou => {
        let orgUnitsList = [...currentUser.org_units.value];
        const currentOuIndex = orgUnitsList.findIndex(o => o.id === ou.id);
        if (currentOuIndex === -1) {
            orgUnitsList.push(ou);
        }
        orgUnitsList = orderBy(orgUnitsList, [o => o.name], ['asc']);
        handleChange(orgUnitsList);
    };
    return (
        <>
            <OrgUnitSearch
                onSelectOrgUnit={ou => handleAdd(ou)}
                inputLabelObject={MESSAGES.addOrgUnit}
            />
            {currentUser.org_units.value.length > 0 && (
                <Box className={classes.chipList}>
                    <Typography
                        variant="subtitle1"
                        className={classes.chipListTitle}
                    >
                        <FormattedMessage {...MESSAGES.selectedOrgUnits} />:
                    </Typography>
                    {currentUser.org_units.value.map(ou => (
                        <OrgUnitTooltip orgUnit={ou} key={ou.id}>
                            <Chip
                                label={getOrgunitMessage(ou)}
                                onDelete={() => handleDelete(ou)}
                                className={classes.chip}
                                color="primary"
                            />
                        </OrgUnitTooltip>
                    ))}
                </Box>
            )}
        </>
    );
};

UsersLocations.propTypes = {
    handleChange: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
};

export default UsersLocations;
