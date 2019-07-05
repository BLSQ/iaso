import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import { setInstances } from '../redux/instancesReducer';
import { setCurrentForm } from '../redux/formsReducer';

import { getRequest } from '../libs/Api';

import { createUrl } from '../../../utils/fetchData';
import getInstancesColumns from '../utils/instancesUtils';

import TopBar from '../components/TopBar';
import CustomTableComponent from '../../../components/CustomTableComponent';


const baseUrl = 'instances';

const styles = theme => ({
    container: {
        marginTop: theme.spacing(2),
    },
});


class Instances extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tableColumns: [],
        };
    }

    componentDidMount() {
        const {
            params: {
                formId,
            },
            currentForm,
        } = this.props;
        if (formId && !currentForm) {
            getRequest(`/api/forms/${formId}`).then((form) => {
                this.props.setCurrentForm(form);
            });
        }
        this.fetchInstances();
    }

    getTopBarTitle() {
        const {
            params,
            currentForm,
            intl: {
                formatMessage,
            },
        } = this.props;
        let topBarTitle = '';
        if (!params.formId) {
            topBarTitle = formatMessage({
                defaultMessage: 'Enregistrements',
                id: 'iaso.instance.title',
            });
        } else if (currentForm) {
            topBarTitle = `${formatMessage({
                defaultMessage: 'Enregistrement(s) pour le formulaire',
                id: 'iaso.instance.form',
            })}: ${currentForm.name}`;
        }
        return topBarTitle;
    }

    getEndpointUrl(toExport, exportType = 'csv') {
        let url = '/api/instances/?';
        const {
            params,
        } = this.props;
        const urlParams = {
            ...params,
        };

        if (toExport) {
            urlParams[exportType] = true;
        }

        Object.keys(urlParams).forEach((key) => {
            const value = urlParams[key];
            if (value && !url.includes(key)) {
                url += `&${key}=${value}`;
            }
        });
        return url;
    }


    goBack() {
        const { redirectTo, params } = this.props;
        this.props.setCurrentForm(undefined);
        this.props.setInstances([], true, params, 0, 0);
        redirectTo('forms', {});
    }

    fetchInstances() {
        const {
            params: {
                formId,
                order,
                limit,
                page,
            },
            intl: {
                formatMessage,
            },
        } = this.props;
        const { params } = this.props;
        let url = '/api/instances/?';
        if (formId) {
            url = `${url}&form_id=${formId}`;
        }
        url = `${url}&order=${!order ? 'updated_at' : order}&limit=${!limit ? '50' : limit}&page=${!page ? '1' : page}`;
        getRequest(url).then((data) => {
            const instances = {
                ...data.instances,
            };
            this.setState({
                tableColumns: getInstancesColumns(formatMessage, instances),
            });
            this.props.setInstances(data.instances, true, params, data.count, data.pages);
        });
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            fetching,
        } = this.props;
        console.log('reduxPage.list', reduxPage.list);
        return (
            <Fragment>
                <TopBar
                    title={this.getTopBarTitle()}
                    showGoBack={Boolean(params.formId)}
                    goBack={() => this.goBack()}
                />
                {
                    !fetching && (
                        <Container maxWidth={false} className={classes.container}>
                            <CustomTableComponent
                                isSortable
                                pageSize={50}
                                showPagination
                                endPointUrl="/api/instances/?"
                                columns={this.state.tableColumns}
                                defaultSorted={[{ id: 'updated_at', desc: false }]}
                                params={params}
                                defaultPath={baseUrl}
                                dataKey="instances"
                                onRowClicked={instanceItem => console.log(instanceItem)}
                                multiSort
                                fetchDatas={false}
                                canSelect={false}
                                reduxPage={reduxPage}
                            />
                        </Container>
                    )
                }
            </Fragment>
        );
    }
}
Instances.defaultProps = {
    reduxPage: undefined,
    currentForm: undefined,
};

Instances.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    reduxPage: PropTypes.object,
    params: PropTypes.object.isRequired,
    setInstances: PropTypes.func.isRequired,
    setCurrentForm: PropTypes.func.isRequired,
    currentForm: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    fetching: state.instances.fetching,
    currentForm: state.forms.current,
});

const MapDispatchToProps = dispatch => ({
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setInstances: (instances, showPagination, params, count, pages) => dispatch(setInstances(instances, showPagination, params, count, pages)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
