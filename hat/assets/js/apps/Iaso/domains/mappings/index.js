import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { withStyles, Box } from '@material-ui/core';
import PropTypes from 'prop-types';
import ReactTable, { ReactTableDefaults } from 'react-table';
import Grid from '@material-ui/core/Grid';
import isEqual from 'lodash/isEqual';

import { bindActionCreators } from 'redux';
import { redirectTo as redirectToAction } from '../../routing/actions';
import { fetchMappingVersions as fetchMappingVersionsAction } from './actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';

import mappingsTableColumns from './config';
import { getSort } from './utils';

import { formatThousand } from '../../../../utils';
import commonStyles from '../../styles/common';
import customTableTranslations from '../../../../utils/constants/customTableTranslations';
import CreateMappingVersionDialogComponent from './components/CreateMappingVersionDialogComponent';

import { mappingsPath } from '../../constants/paths';

const { baseUrl } = mappingsPath;

const styles = theme => ({
    ...commonStyles(theme),
    reactTable: {
        ...commonStyles(theme).reactTable,
        marginTop: theme.spacing(4),
    },
});

class Mappings extends Component {
    componentDidMount() {
        const {
            intl: { formatMessage },
            fetchMappingVersions,
            params,
        } = this.props;
        fetchMappingVersions(params);
        Object.assign(ReactTableDefaults, customTableTranslations(formatMessage));
    }

    componentDidUpdate(prevProps) {
        const { params, fetchMappingVersions } = this.props;
        if (!isEqual(prevProps.params, params)) {
            fetchMappingVersions(params);
        }
    }

    onTableParamsChange(key, value) {
        const { params, redirectTo } = this.props;
        redirectTo(baseUrl, {
            ...params,
            [key]: key !== 'order' ? value : getSort(value),
        });
    }

    selectInstance(mappingversion) {
        const { redirectTo } = this.props;
        redirectTo('forms/mapping', {
            mappingVersionId: mappingversion.id,
        });
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
        } = this.props;
        const pageSize = parseInt(params.pageSize, 10) < mappingVersions.length
            ? params.pageSize
            : mappingVersions.length;
        return (
            <>
                {fetching && <LoadingSpinner />}
                <TopBar
                    title={formatMessage({
                        defaultMessage: 'DHIS mappings',
                        id: 'iaso.label.dhis2Mappings',
                    })}
                />
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <div className={classes.reactTable}>
                        <div className="count-container">
                            {count > 0 && (
                                <div>
                                    {`${formatThousand(count)} `}
                                    <FormattedMessage
                                        id="table.results_"
                                        defaultMessage="résultat(s)"
                                    />
                                </div>
                            )}
                        </div>
                        <ReactTable
                            showPagination={parseInt(params.pageSize, 10) < count}
                            multiSort
                            manual
                            columns={mappingsTableColumns(formatMessage, this)}
                            data={mappingVersions}
                            pages={pages}
                            className="-striped -highlight"
                            defaultSorted={[
                                { id: 'form_version__form__name', desc: true },
                                { id: 'form_version__version_id', desc: true },
                                { id: 'mapping__mapping_type', desc: true },
                            ]}
                            pageSize={pageSize}
                            page={params.page - 1}
                            onPageChange={page => this.onTableParamsChange('page', page + 1)
                            }
                            onPageSizeChange={newPageSize => this.onTableParamsChange('pageSize', newPageSize)
                            }
                            onSortedChange={order => this.onTableParamsChange('order', order)
                            }
                        />
                    </div>
                    <Grid
                        container
                        spacing={0}
                        justify="flex-end"
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
