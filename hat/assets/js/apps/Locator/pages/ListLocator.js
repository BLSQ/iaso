import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import { createUrl } from '../../../utils/fetchData';
import LoadingSpinner from '../../../components/loading-spinner';
import CustomTableComponent from '../../../components/CustomTableComponent';
import listLocatorColumns from '../constants/ListLocatorColumns';

export class ListLocator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: listLocatorColumns(props.intl.formatMessage),
        };
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
                    endPointUrl="/api/cases/?"
                    columns={this.state.tableColumns}
                    defaultSorted={[{ id: 'form_number', desc: false }]}
                    params={this.props.params}
                    defaultPath="list"
                    dataKey="cases"
                    onRowClicked={caseItem => this.selectCase(caseItem)}
                    multiSort
                />
            </div>
        );
    }
}

ListLocator.propTypes = {
    params: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    load: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
};

const LocatorWithIntl = injectIntl(ListLocator);

const MapDispatchToProps = dispatch => ({
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

const MapStateToProps = state => ({
    load: state.load,
    villageFilters: state.locator,
    kase: state.kase,
});


export default connect(MapStateToProps, MapDispatchToProps)(LocatorWithIntl);
