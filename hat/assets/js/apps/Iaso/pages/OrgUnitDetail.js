import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { push } from 'react-router-redux';

import {
    withStyles, Divider, Paper, Tabs, Tab, Grid,
} from '@material-ui/core';

import Button from '@material-ui/core/Button';
import Save from '@material-ui/icons/Save';
import Cancel from '@material-ui/icons/Cancel';

import PropTypes from 'prop-types';

import {
    setCurrentOrgUnit, setOrgUnitTypes, setSourceTypes, resetOrgUnits,
} from '../redux/orgUnitsReducer';
import { resetOrgUnitsLevels } from '../redux/orgUnitsLevelsReducer';

import { createUrl } from '../../../utils/fetchData';
import {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
    fetchOrgUnitDetail,
    saveOrgUnit,
} from '../utils/requests';
import { getAliasesArrayFromString, getOrgUnitsTree } from '../utils/orgUnitUtils';

import TopBar from '../components/nav/TopBarComponent';
import OrgUnitInfos from '../components/infos/OrgUnitInfosComponent';
import OrgUnitMap from '../components/maps/OrgUnitMapComponent';
import Logs from '../components/logs/LogsComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';

import commonStyles from '../styles/common';


const baseUrl = 'orgunits/detail';

const styles = theme => ({
    ...commonStyles(theme),
    paperContainer: {
        ...commonStyles(theme).paperContainer,
        marginTop: 0,
    },
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
        if (this.props.orgUnitTypes.length === 0) {
            fetchOrgUnitsTypes(this.props.dispatch).then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        }
        if (this.props.sourceTypes.length === 0) {
            fetchSourceTypes(this.props.dispatch).then(sourceTypes => this.props.setSourceTypes(sourceTypes));
        }
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
            dispatch,
        } = this.props;
        if (orgUnitId) {
            fetchOrgUnitDetail(dispatch, orgUnitId).then((orgUnit) => {
                const orgUnitTree = getOrgUnitsTree(orgUnit);
                if (orgUnitTree.length > 0) {
                    const { redirectTo, params } = this.props;
                    const levels = orgUnitTree.map(o => o.id);
                    const newParams = {
                        ...params,
                        levels,
                    };
                    redirectTo(baseUrl, newParams);
                }
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

    handleChangeLocation(location) {
        this.setState({
            orgUnitModified: true,
            currentOrgUnit: {
                ...this.state.currentOrgUnit,
                latitude: location.lat ? parseFloat(location.lat.toFixed(8)) : null,
                longitude: location.lng ? parseFloat(location.lng.toFixed(8)) : null,
            },
        });
    }

    saveOrgUnit() {
        saveOrgUnit(this.props.dispatch, this.state.currentOrgUnit).then(
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
        this.props.resetOrgUnitsLevels();
        const { redirectTo, params } = this.props;
        const newParams = {
            ...params,
            levels: null,
        };
        redirectTo(baseUrl, newParams);
        this.setState({
            orgUnitModified: false,
            currentOrgUnit: this.props.currentOrgUnit,
        });
        this.fetchDetail();
    }

    goToRevision(orgUnitRevision) {
        const mappedRevision = {
            ...this.props.currentOrgUnit,
            ...orgUnitRevision.fields,
            geo_json: null,
            aliases: orgUnitRevision.fields.aliases ? getAliasesArrayFromString(orgUnitRevision.fields.aliases) : this.props.currentOrgUnit.aliases,
            id: this.props.currentOrgUnit.id,
        };
        return saveOrgUnit(this.props.dispatch, mappedRevision).then(
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

    goBack() {
        const { redirectTo, params } = this.props;
        this.props.setCurrentOrgUnit(undefined);
        const tempParams = {
            ...params,
        };
        delete tempParams.tab;
        delete tempParams.orgUnitId;
        delete tempParams.orgUnitsPageSize;
        delete tempParams.orgUnitsOrder;
        delete tempParams.orgUnitsPage;
        delete tempParams.orgUnitsLevels;
        this.props.resetOrgUnitsLevels();
        redirectTo('orgunits', {
            ...tempParams,
            levels: params.orgUnitsLevels,
            order: params.orgUnitsOrder,
            pageSize: params.orgUnitsPageSize,
            page: params.orgUnitsPage,
            back: true,
        });
    }

    render() {
        const {
            classes,
            fetching,
            fetchingSubOrgUnits,
            intl: {
                formatMessage,
            },
            orgUnitTypes,
            sourceTypes,
            params,
        } = this.props;
        const {
            tab,
            currentOrgUnit,
            orgUnitModified,
        } = this.state;
        let title = currentOrgUnit ? currentOrgUnit.name : '';
        if (currentOrgUnit) {
            title = `${title}${currentOrgUnit.org_unit_type_name ? ` - ${currentOrgUnit.org_unit_type_name}` : ''}`;
        }
        return (
            <Fragment>
                <TopBar
                    title={title}
                    displayBackButton
                    goBack={() => this.goBack()}
                >
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
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
                        <Tab
                            value="history"
                            label={formatMessage({
                                defaultMessage: 'History',
                                id: 'iaso.label.history',
                            })}
                        />
                    </Tabs>
                </TopBar>
                {
                    fetchingSubOrgUnits && <LoadingSpinner />
                }
                {!fetching
                    && currentOrgUnit
                    && (
                        <section>
                            <Paper className={classes.paperContainer}>
                                <div className={classes.marginBottom}>
                                    {
                                        tab === 'infos' && (
                                            <OrgUnitInfos
                                                params={params}
                                                baseUrl={baseUrl}
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
                                            <OrgUnitMap
                                                orgUnitTypes={orgUnitTypes}
                                                orgUnit={currentOrgUnit}
                                                onChangeLocation={(location) => {
                                                    this.handleChangeLocation(location);
                                                }}
                                                onChange={geoJson => this.handleChangeInfo('geo_json', geoJson)}
                                            />
                                        )
                                    }
                                    {
                                        tab === 'history' && (
                                            <Logs
                                                params={params}
                                                logObjectId={currentOrgUnit.id}
                                                goToRevision={orgUnitRevision => this.goToRevision(orgUnitRevision)}
                                            />
                                        )
                                    }
                                </div>
                                <Divider className={classes.dividerMarginNeg} />
                                <Grid container spacing={0} alignItems="center" className={classes.marginTopBig}>

                                    <Grid xs={12} item className={classes.textAlignRight}>
                                        {
                                            tab !== 'history' && (
                                                <Fragment>
                                                    <Button
                                                        className={classes.marginLeft}
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
                                                </Fragment>
                                            )
                                        }
                                    </Grid>
                                </Grid>
                            </Paper>
                        </section>
                    )
                }
            </Fragment>
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
    fetchingSubOrgUnits: PropTypes.bool.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
    resetOrgUnitsLevels: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    fetchingSubOrgUnits: state.orgUnits.fetchingSubOrgUnits,
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
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
