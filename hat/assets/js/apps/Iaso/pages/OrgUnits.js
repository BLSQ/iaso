import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import { setOrgUnits } from '../redux/orgUnitsReducer';

import orgUnitsTableColumns from '../constants/orgUnitsTableColumns';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/nav/TopBarComponent';
import CustomTableComponent from '../../../components/CustomTableComponent';
import OrgUnitsFiltersComponent from '../components/filters/OrgUnitsFiltersComponent';

import commonStyles from '../styles/common';

const baseUrl = 'orgunits';

const styles = theme => ({
    ...commonStyles(theme),
    filterContainer: {
        margin: theme.spacing(4),
        backgroundColor: 'white',
        padding: theme.spacing(2),
        width: 'auto',
        border: '1px solid #ccc',
    },
    container: {
        ...commonStyles(theme).container,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(4),
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
});

class OrgUnits extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: orgUnitsTableColumns(props.intl.formatMessage, this),
            tableUrl: null,
        };
    }

    componentWillMount() {
        if (this.props.params.back) {
            this.onSearch();
            const { params } = this.props;
            delete params.back;
            this.props.redirectTo(baseUrl, params);
        }
    }

    onSearch() {
        this.setState({
            tableUrl: this.getEndpointUrl(),
        });
    }

    getEndpointUrl() {
        let url = '/api/orgunits/?';
        const {
            params,
        } = this.props;

        const urlParams = {
            ...params,
        };

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectOrgUnit(orgUnit) {
        const { redirectTo, params } = this.props;
        const newParams = {
            orgUnitId: orgUnit.id,
            ...params,
            orgUnitsOrder: params.order,
            orgUnitsPageSize: params.pageSize,
            orgUnitsPage: params.page,
        };
        delete newParams.page;
        delete newParams.pageSize;
        delete newParams.order;
        redirectTo('orgunits/detail', newParams);
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            tableUrl,
            tableColumns,
        } = this.state;
        return (
            <section>
                <TopBar title={formatMessage({
                    defaultMessage: 'Org units',
                    id: 'iaso.orgUnits.title',
                })}
                />
                <OrgUnitsFiltersComponent
                    baseUrl={baseUrl}
                    params={params}
                    onSearch={() => this.onSearch()}
                />
                {
                    tableUrl && (
                        <Fragment>
                            <Container maxWidth={false} className={classes.container}>
                                <CustomTableComponent
                                    isSortable
                                    pageSize={50}
                                    showPagination
                                    endPointUrl={tableUrl}
                                    columns={tableColumns}
                                    defaultSorted={[{ id: 'id', desc: false }]}
                                    params={params}
                                    defaultPath={baseUrl}
                                    dataKey="orgunits"
                                    canSelect={false}
                                    multiSort
                                    onDataLoaded={(orgUnitsList, count, pages) => this.props.setOrgUnits(orgUnitsList, this.props.params, count, pages)}
                                    reduxPage={reduxPage}
                                />
                            </Container>
                        </Fragment>

                    )
                }
            </section>
        );
    }
}
OrgUnits.defaultProps = {
    reduxPage: undefined,
};

OrgUnits.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setOrgUnits: PropTypes.func.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.orgUnits.orgUnitsPage,
});

const MapDispatchToProps = dispatch => ({
    setOrgUnits: (orgUnitsList, params, count, pages) => dispatch(setOrgUnits(orgUnitsList, true, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnits)),
);
