import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';

import PropTypes from 'prop-types';

import { setInstances } from '../redux/instances';
import { setCurrentForm } from '../redux/forms';

import { getRequest } from '../libs/Api';

import { createUrl } from '../../../utils/fetchData';

import instancesTableColumns from '../constants/instancesTableColumns';

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
            tableColumns: instancesTableColumns(props.intl.formatMessage),
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
                defaultMessage: 'Formulaire',
                id: 'iaso.instance.form',
            })}: ${currentForm.name}`;
        }
        return topBarTitle;
    }

    goBack() {
        const { redirectTo } = this.props;
        this.props.setCurrentForm(undefined);
        redirectTo('forms', {});
        this.props.setCurrentForm(undefined);
    }

    render() {
        const {
            classes,
            params,
            reduxPage,
            currentForm,
            intl: {
                formatMessage,
            },
        } = this.props;
        console.log(reduxPage);
        if (reduxPage && reduxPage.list) {
            const i = reduxPage.list[0];
            if (i.file_content) {
                console.log(i.file_content);
                // console.log(parser.toJson(i.file_content[0]));
            }
        }
        return (
            <Fragment>
                <TopBar
                    title={this.getTopBarTitle()}
                    showGoBack={Boolean(params.formId)}
                    goBack={() => this.goBack()}
                />
                <Container maxWidth={false} className={classes.container}>
                    <CustomTableComponent
                        isSortable
                        showPagination
                        endPointUrl="/api/instances/?"
                        columns={this.state.tableColumns}
                        defaultSorted={[{ id: 'updated_at', desc: false }]}
                        params={params}
                        defaultPath={baseUrl}
                        dataKey="instances"
                        onRowClicked={instanceItem => console.log(instanceItem)}
                        multiSort
                        onDataLoaded={(newFormsList, count, pages) => this.props.setInstances(newFormsList, true, params, count, pages)}
                        reduxPage={reduxPage}
                    />
                </Container>
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
};

const MapStateToProps = state => ({
    reduxPage: state.instances.instancesPage,
    currentForm: state.forms.current,
});

const MapDispatchToProps = dispatch => ({
    setCurrentForm: form => dispatch(setCurrentForm(form)),
    setInstances: instances => dispatch(setInstances(instances)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(Instances)),
);
