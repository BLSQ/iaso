import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import ListFilters from '../components/ListFilters';
import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import listLocatorColumns from '../constants/ListLocatorColumns';
import { listLocatorActions } from '../redux/listLocator';

export class ListLocator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: listLocatorColumns(props.intl.formatMessage),
        };
    }

    componentWillMount() {
        Promise.all([
            this.props.fetchProvinces(),
            this.props.fetchZones(),
            this.props.fetchAreas(),
            this.props.fetchTeams(),
        ]);
    }


    getEnpointUrl() {
        let url = '/api/cases/?';
        const urlParams = {
            province_id: this.props.params.province_id,
            as_id: this.props.params.as_id,
            zs_id: this.props.params.zs_id,
            years: this.props.params.years,
            teams: this.props.params.teams,
        };

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }

    selectCase(caseItem) {
        this.props.redirectTo('', {
            case_id: caseItem.id,
            ...this.props.params,
        });
    }


    render() {
        const { formatMessage } = this.props.intl;
        return (
            <section>
                <div className="widget__container">
                    <ListFilters
                        filters={this.props.listFilters}
                        params={this.props.params}
                        redirect={(params) => {
                            const tempParam = params;
                            tempParam.page = 1;
                            return (this.props.redirectTo('list', tempParam));
                        }}
                    />
                </div>
                <div className="locator-container widget__container">
                    {
                        this.props.load.loading &&
                        <div className="widget__content">
                            <LoadingSpinner message={formatMessage({
                                defaultMessage: 'Chargement en cours',
                                id: 'microplanning.labels.loading',
                            })}
                            />
                        </div>
                    }

                    <CustomTableComponent
                        isSortable
                        showPagination
                        endPointUrl={this.getEnpointUrl()}
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'form_year', desc: false }]}
                        params={this.props.params}
                        defaultPath="list"
                        dataKey="cases"
                        onRowClicked={caseItem => this.selectCase(caseItem)}
                        multiSort
                    />
                </div>
            </section>
        );
    }
}

ListLocator.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    fetchZones: PropTypes.func.isRequired,
    fetchProvinces: PropTypes.func.isRequired,
    fetchAreas: PropTypes.func.isRequired,
    fetchTeams: PropTypes.func.isRequired,
    listFilters: PropTypes.object.isRequired,
};

const LocatorWithIntl = injectIntl(ListLocator);

const MapDispatchToProps = dispatch => ({
    fetchZones: () => dispatch(listLocatorActions.fetchZones(dispatch)),
    fetchProvinces: () => dispatch(listLocatorActions.fetchProvinces(dispatch)),
    fetchAreas: () => dispatch(listLocatorActions.fetchAreas(dispatch)),
    fetchTeams: () => dispatch(listLocatorActions.fetchTeams(dispatch)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const MapStateToProps = state => ({
    load: state.load,
    listFilters: state.listLocator,
    kase: state.kase,
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
