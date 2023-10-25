import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Box } from '@mui/material';
import { withStyles } from '@mui/styles';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import isEqual from 'lodash/isEqual';

import { bindActionCreators } from 'redux';
import {
    injectIntl,
    commonStyles,
    LoadingSpinner,
    Table,
} from 'bluesquare-components';
import { redirectTo as redirectToAction } from '../../routing/actions';
import { fetchMappingVersions as fetchMappingVersionsAction } from './actions';
import TopBar from '../../components/nav/TopBarComponent';
import mappingsTableColumns from './config';

import CreateMappingVersionDialogComponent from './components/CreateMappingVersionDialogComponent';

import { baseUrls } from '../../constants/urls';

import MESSAGES from './messages';

const baseUrl = baseUrls.mappings;

const styles = theme => ({
    ...commonStyles(theme),
});

class Mappings extends Component {
    componentDidMount() {
        const { fetchMappingVersions, params } = this.props;
        fetchMappingVersions(params);
    }

    componentDidUpdate(prevProps) {
        const { params, fetchMappingVersions } = this.props;
        if (!isEqual(prevProps.params, params)) {
            fetchMappingVersions(params);
        }
    }

    render() {
        const {
            classes,
            params,
            intl: { formatMessage },
            mappingVersions,
            fetching,
            count,
            pages,
            redirectTo,
        } = this.props;
        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar title={formatMessage(MESSAGES.dhis2Mappings)} />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Table
                        data={mappingVersions}
                        pages={pages}
                        defaultSorted={[
                            { id: 'form_version__form__name', desc: true },
                            { id: 'form_version__version_id', desc: true },
                            { id: 'mapping__mapping_type', desc: true },
                        ]}
                        columns={mappingsTableColumns(formatMessage)}
                        count={count}
                        baseUrl={baseUrl}
                        params={params}
                        redirectTo={redirectTo}
                    />
                    <Grid
                        container
                        spacing={0}
                        justifyContent="flex-end"
                        alignItems="center"
                        className={classes.marginTop}
                    >
                        <CreateMappingVersionDialogComponent />
                    </Grid>
                </Box>
            </>
        );
    }
}
Mappings.defaultProps = {
    count: 0,
};

Mappings.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchMappingVersions: PropTypes.func.isRequired,
    mappingVersions: PropTypes.array.isRequired,
    count: PropTypes.number,
    fetching: PropTypes.bool.isRequired,
    pages: PropTypes.number.isRequired,
};

const MapStateToProps = state => ({
    mappingVersions: state.mappings.mappingVersions,
    count: state.mappings.count,
    pages: state.mappings.pages,
    fetching: state.mappings.fetching,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators(
        {
            fetchMappingVersions: fetchMappingVersionsAction,
            redirectTo: redirectToAction,
        },
        dispatch,
    ),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Mappings)),
);
