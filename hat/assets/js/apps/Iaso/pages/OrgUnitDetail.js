import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import Save from '@material-ui/icons/Save';
import Cancel from '@material-ui/icons/Cancel';

import PropTypes from 'prop-types';

import {
    setCurrentOrgUnit, setOrgUnitTypes, setSourceTypes, resetOrgUnits,
} from '../redux/orgUnitsReducer';

import { createUrl } from '../../../utils/fetchData';
import {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
    fetchOrgUnitDetail,
    saveOrgUnit,
} from '../utils/requests';

import TopBar from '../components/nav/TopBarComponent';
import OrgUnitInfos from '../components/infos/OrgUnitInfosComponent';
import BackButton from '../components/buttons/BackButtonComponent';
import OrgUnitMap from '../components/maps/OrgUnitMapComponent';

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
            currentOrgUnit: undefined,
            orgUnitModified: false,
        };
    }

    componentDidMount() {
        this.fetchDetail();
        fetchOrgUnitsTypes().then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        fetchSourceTypes().then(sourceTypes => this.props.setSourceTypes(sourceTypes));
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
            fetchOrgUnitDetail(orgUnitId).then((orgUnit) => {
                this.props.setCurrentOrgUnit(orgUnit);
                this.setState({
                    currentOrgUnit: orgUnit,
                });
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

    handleChangeInfo(key, value) {
        this.setState({
            orgUnitModified: true,
            currentOrgUnit: {
                ...this.state.currentOrgUnit,
                [key]: value,
            },
        });
    }

    saveOrgUnit() {
        saveOrgUnit(this.state.currentOrgUnit, this.props.dispatch).then(
            (currentOrgUnit) => {
                this.setState({
                    orgUnitModified: false,
                    currentOrgUnit,
                });
                this.props.resetOrgUnits();
                this.props.setCurrentOrgUnit(currentOrgUnit);
            },
        );
    }

    resetOrgUnit() {
        this.setState({
            orgUnitModified: false,
            currentOrgUnit: this.props.currentOrgUnit,
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
            search: params.search,
            back: true,
        });
    }

    render() {
        const {
            classes,
            fetching,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sourceTypes,
        } = this.props;
        const {
            tab,
            currentOrgUnit,
            orgUnitModified,
        } = this.state;
        return (
            <section className="orgunit detail">
                <TopBar
                    title={this.props.currentOrgUnit ? this.props.currentOrgUnit.name : ''}
                />
                {!fetching
                    && currentOrgUnit
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
                                                id: 'iaso.orgUnits.infos',
                                            })}
                                        />
                                        <Tab
                                            value="map"
                                            label={formatMessage({
                                                defaultMessage: 'Map',
                                                id: 'iaso.orgUnits.map',
                                            })}
                                        />
                                    </Tabs>
                                </AppBar>
                                <Container maxWidth={false} className={classes.whiteContainerNoMargin}>
                                    {
                                        tab === 'infos' && (
                                            <OrgUnitInfos
                                                orgUnitModified={orgUnitModified}
                                                orgUnit={currentOrgUnit}
                                                orgUnitTypes={orgUnitTypes}
                                                sourceTypes={sourceTypes}
                                                onChangeInfo={(key, value) => this.handleChangeInfo(key, value)}
                                            />
                                        )
                                    }
                                    {
                                        tab === 'map' && (
                                            <OrgUnitMap />
                                        )
                                    }
                                    <div className={classes.justifyFlexEnd}>
                                        <Button
                                            disabled={!orgUnitModified}
                                            variant="contained"
                                            onClick={() => this.resetOrgUnit()}
                                        >
                                            <Cancel className={classes.buttonIcon} fontSize="small" />
                                            <FormattedMessage id="iaso.label.cancel" defaultMessage="Cancel" />
                                        </Button>
                                        <Button
                                            disabled={!orgUnitModified}
                                            variant="contained"
                                            className={classes.marginLeft}
                                            color="primary"
                                            onClick={() => this.saveOrgUnit(currentOrgUnit)}
                                        >
                                            <Save className={classes.buttonIcon} fontSize="small" />
                                            <FormattedMessage id="iaso.label.save" defaultMessage="Save" />
                                        </Button>
                                    </div>
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
    setOrgUnitTypes: PropTypes.func.isRequired,
    setSourceTypes: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    sourceTypes: state.orgUnits.sourceTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setSourceTypes: sourceTypes => dispatch(setSourceTypes(sourceTypes)),
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
