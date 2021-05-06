import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';
import { withStyles, Box, Typography } from '@material-ui/core';

import { setSourcesSelected } from '../../../domains/orgUnits/actions';

import ChipsFilterComponent from './ChipsFilterComponent';

import { fetchAssociatedOrgUnits } from '../../../utils/requests';
import commonStyles from '../../../styles/common';

import { getSourcesWithoutCurrentSource } from '../../../domains/orgUnits/utils';

import MESSAGES from '../messages';

const styles = theme => ({
    ...commonStyles(theme),
    content: {
        padding: theme.spacing(0, 3, 2, 3),
    },
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
    if (!currentOrgUnit) return null;
    const sources = getSourcesWithoutCurrentSource(
        currentSources,
        currentOrgUnit.source_id,
    );
    return (
        <>
            <Box px={2} className={classes.innerDrawerToolbar} component="div">
                <Typography variant="subtitle1">
                    <FormattedMessage {...MESSAGES.sources} />
                </Typography>
            </Box>
            {sources.length === 0 && (
                <Typography
                    variant="body2"
                    align="center"
                    color="textSecondary"
                >
                    <FormattedMessage {...MESSAGES.noSources} />
                </Typography>
            )}
            <ChipsFilterComponent
                selectLabelMessage={MESSAGES.addSource}
                locationsKey="orgUnits"
                fetchDetails={source =>
                    fetchAssociatedOrgUnits(
                        dispatch,
                        source,
                        currentOrgUnit,
                        fitToBounds,
                    )}
                setSelectedItems={props.setSelectedItems}
                selectedItems={sourcesSelected}
                currentItems={sources}
            />
        </>
    );
}

SourcesChipsFilterComponent.defaultProps = {
    currentSources: null,
    sourcesSelected: [],
};

SourcesChipsFilterComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    currentSources: PropTypes.any,
    currentOrgUnit: PropTypes.object.isRequired,
    sourcesSelected: PropTypes.array,
    setSelectedItems: PropTypes.func.isRequired,
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
    setSelectedItems: sources => dispatch(setSourcesSelected(sources)),
});

export default connect(
    MapStateToProps,
    MapDispatchToProps,
)(withStyles(styles)(SourcesChipsFilterComponent));
