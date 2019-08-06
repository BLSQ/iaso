import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';

import PropTypes from 'prop-types';

import { setCurrentOrgUnit } from '../redux/orgUnitsReducer';

import { getRequest } from '../libs/Api';

import { createUrl } from '../../../utils/fetchData';

import TopBar from '../components/TopBarComponent';
import BackButton from '../components/BackButtonComponent';

import commonStyles from '../styles/common';


const baseUrl = 'orgunits/detail';

const styles = theme => ({
    ...commonStyles(theme),
});


class OrgUnitDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tab: props.params.tab ? props.params.tab : 'infos',
        };
    }

    componentDidMount() {
        this.fetchDetail();
    }

    componentDidUpdate(prevProps) {
        const {
            params,
        } = this.props;
        if (params.orgUnitId !== prevProps.params.orgUnitId) {
            this.fetchDetail();
        }
        if (params.tab !== prevProps.params.tab) {
            this.handleChangeTab(params.tab, false);
        }
    }

    fetchDetail() {
        const {
            params: {
                orgUnitId,
            },
            currentOrgUnit,
        } = this.props;
        if (orgUnitId && !currentOrgUnit) {
            getRequest(`/api/orgunits/${orgUnitId}`).then((orgUnit) => {
                this.props.setCurrentOrgUnit(orgUnit);
            });
        }
    }

    handleChangeTab(tab, redirect = true) {
        if (redirect) {
            const { redirectTo, params } = this.props;
            const newParams = {
                ...params,
                tab,
            };
            redirectTo(baseUrl, newParams);
        }
        this.setState({
            tab,
        });
    }


    goBack() {
        const { redirectTo, params } = this.props;
        this.props.setCurrentOrgUnit(undefined);
        redirectTo('orgunits', {
            validated: params.validated,
            order: params.orgUnitsOrder,
            pageSize: params.orgUnitsPageSize,
            page: params.orgUnitsPage,
        });
    }

    render() {
        const {
            classes,
            fetching,
            currentOrgUnit,
            intl: {
                formatMessage,
            },
        } = this.props;
        const {
            tab,
        } = this.state;
        return (
            <section className="orgunit detail">
                <TopBar
                    title={currentOrgUnit ? currentOrgUnit.name : ''}
                />
                {!fetching
                    && (
                        <Fragment>
                            <Container maxWidth={false} className={classes.whiteContainer}>
                                <BackButton goBack={() => this.goBack()} />
                            </Container>
                            <Container maxWidth={false} className={classes.container}>
                                <AppBar position="static">
                                    <Tabs
                                        value={tab}
                                        classes={{
                                            indicator: classes.indicator,
                                        }}
                                        onChange={(event, newtab) => this.handleChangeTab(newtab)
                                        }
                                    >
                                        <Tab
                                            value="infos"
                                            label={formatMessage({
                                                defaultMessage: 'Infos',
                                                id: 'iaso.orgunits.infos',
                                            })}
                                        />
                                        <Tab
                                            value="map"
                                            label={formatMessage({
                                                defaultMessage: 'Carte',
                                                id: 'iaso.orgunits.map',
                                            })}
                                        />
                                    </Tabs>
                                </AppBar>
                                <Container maxWidth={false} className={classes.whiteContainerNoMargin}>
                                    {
                                        tab === 'infos' && (
                                            <div>infos</div>
                                        )
                                    }
                                    {
                                        tab === 'map' && (
                                            <div>map</div>
                                        )
                                    }
                                </Container>
                            </Container>
                        </Fragment>
                    )
                }
            </section>
        );
    }
}
OrgUnitDetail.defaultProps = {
    currentOrgUnit: undefined,
};

OrgUnitDetail.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    setCurrentOrgUnit: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    currentOrgUnit: state.orgUnits.current,
});

const MapDispatchToProps = dispatch => ({
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
