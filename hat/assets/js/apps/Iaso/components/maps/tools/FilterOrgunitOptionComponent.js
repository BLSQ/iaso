import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import {
    withStyles,
    Box,
    Divider,
    Typography,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

import OrgUnitTypeChipsFilterComponent from '../../filters/chips/OrgUnitTypeChipsFilterComponent';
import FormsChipsFilterComponent from '../../filters/chips/FormsChipsFilterComponent';

const styles = theme => ({
    ...commonStyles(theme),
});

const FilterOrgunitOptionComponent = ({ classes, orgUnitTypes, currentForms }) => {
    return (
        <Fragment>
            {
                orgUnitTypes
                && orgUnitTypes.length > 0
                && (
                    <Fragment>
                        <Box
                            px={2}
                            className={classes.innerDrawerToolbar}
                            component="div"
                        >
                            <Typography variant="subtitle1">
                                <FormattedMessage id="iaso.orgUnits.subOrgUnitsType" defaultMessage="Sub org units types" />
                                :
                            </Typography>
                        </Box>
                        <Divider light />
                        <OrgUnitTypeChipsFilterComponent />
                        <Divider />
                    </Fragment>
                )
            }
            {
                currentForms
                && currentForms.length
                && (
                    <Fragment>
                        <Box
                            px={2}
                            className={classes.innerDrawerToolbar}
                            component="div"
                        >
                            <Typography variant="subtitle1">
                                <FormattedMessage id="iaso.forms.title" defaultMessage="Forms" />
                                :
                            </Typography>
                        </Box>
                        <Divider light />
                        <FormsChipsFilterComponent />
                        <Divider />
                    </Fragment>
                )
            }
        </Fragment>
    );
};

FilterOrgunitOptionComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    currentForms: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    currentForms: state.orgUnits.currentForms,
});

export default connect(MapStateToProps)(withStyles(styles)(FilterOrgunitOptionComponent));
