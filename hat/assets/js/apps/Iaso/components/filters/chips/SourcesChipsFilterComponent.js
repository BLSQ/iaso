import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import {
    withStyles,
    Box,
    Typography,
} from '@material-ui/core';

import { setSourcesSelected } from '../../../redux/orgUnitsReducer';

import ChipsFilterComponent from './ChipsFilterComponent';

import {
    fetchAssociatedOrgUnits,
} from '../../../utils/requests';
import commonStyles from '../../../styles/common';

import {
    getSourcesWithoutCurrentSource,
} from '../../../utils/orgUnitUtils';

const styles = theme => ({
    ...commonStyles(theme),
});

function SourcesChipsFilterComponent(props) {
    const {
        classes,
        sourcesSelected,
        currentSources,
        dispatch,
        currentOrgUnit,
        fitToBounds,
    } = props;
    const sources = getSourcesWithoutCurrentSource(currentSources, currentOrgUnit.source_id);
    return (
        <Fragment>
            <Box
                px={2}
                className={classes.innerDrawerToolbar}
                component="div"
            >
                <Typography variant="subtitle1">
                    <FormattedMessage id="iaso.label.sources" defaultMessage="Sources" />
                </Typography>
            </Box>
            <ChipsFilterComponent
                selectLabelMessage={{
                    id: 'iaso.orgUnits.addSource',
                    defaultMessage: 'Add source',
                }}
                locationsKey="orgUnits"
                fetchDetails={source => fetchAssociatedOrgUnits(
                    dispatch,
                    source,
                    currentOrgUnit,
                    fitToBounds,
                )}
                setSelectedItems={props.setFormsSelected}
                selectedItems={sourcesSelected}
                currentItems={sources}
            />
        </Fragment>
    );
}

SourcesChipsFilterComponent.defaultProps = {
    currentSources: null,
};

SourcesChipsFilterComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    currentSources: PropTypes.any,
    currentOrgUnit: PropTypes.object.isRequired,
    sourcesSelected: PropTypes.array.isRequired,
    setFormsSelected: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
    fitToBounds: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    currentSources: state.orgUnits.sources,
    sourcesSelected: state.orgUnits.currentSourcesSelected,
    currentOrgUnit: state.orgUnits.current,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setFormsSelected: sources => dispatch(setSourcesSelected(sources)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(SourcesChipsFilterComponent));
