import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { push, replace } from 'react-router-redux';

import {
    withStyles, Box, Tabs, Tab, Grid,
} from '@material-ui/core';

import Button from '@material-ui/core/Button';

import PropTypes from 'prop-types';

import {
    setCurrentOrgUnit,
    setOrgUnitTypes,
    setSourceTypes,
    resetOrgUnits,
    setCurrentForms,
    setSources,
} from '../redux/orgUnitsReducer';
import { resetOrgUnitsLevels } from '../redux/orgUnitsLevelsReducer';

import { createUrl } from '../../../utils/fetchData';
import {
    fetchOrgUnitsTypes,
    fetchSourceTypes,
    fetchSources,
    fetchOrgUnitDetail,
    fetchForms,
    saveOrgUnit,
} from '../utils/requests';
import { getAliasesArrayFromString, getOrgUnitsTree } from '../utils/orgUnitUtils';

import TopBar from '../components/nav/TopBarComponent';
import OrgUnitInfos from '../components/infos/OrgUnitInfosComponent';
import OrgUnitMap from '../components/maps/OrgUnitMapComponent';
import Logs from '../components/logs/LogsComponent';
import LoadingSpinner from '../components/LoadingSpinnerComponent';

import commonStyles from '../styles/common';

import chipColors from '../constants/chipColors';

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
            orgUnitLocationModified: false,
        };
    }

    componentDidMount() {
        this.props.resetOrgUnitsLevels();
        this.fetchDetail();
        if (this.props.orgUnitTypes.length === 0) {
            fetchOrgUnitsTypes(this.props.dispatch)
                .then(orgUnitTypes => this.props.setOrgUnitTypes(orgUnitTypes));
        }
        if (this.props.sourceTypes.length === 0) {
            fetchSourceTypes(this.props.dispatch)
                .then(sourceTypes => this.props.setSourceTypes(sourceTypes));
        }
        if (!this.props.sources) {
            fetchSources(this.props.dispatch)
                .then((data) => {
                    const sources = [];
                    data.forEach((s, i) => {
                        sources.push({
                            ...s,
                            color: chipColors[i],
                        });
                    });
                    this.props.setSources(sources);
                });
        }
    }

    componentDidUpdate(prevProps) {
        const {
            params,
        } = this.props;
        if (params.orgUnitId !== prevProps.params.orgUnitId) {
            this.resetCurrentOrgUnit();
            this.fetchDetail();
        }
        if (params.tab !== prevProps.params.tab) {
            this.handleChangeTab(params.tab, false);
        }
    }

    setOrgUnitLocationModified() {
        this.setState({
            orgUnitLocationModified: true,
        });
    }

    resetCurrentOrgUnit() {
        this.setState({
            currentOrgUnit: undefined,
        });
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

                fetchForms(this.props.dispatch, `/api/forms/?orgUnitTypeId=${orgUnit.org_unit_type_id}`)
                    .then((data) => {
                        const forms = [];
                        const formsColors = [...chipColors].reverse();
                        data.forms.forEach((f, i) => {
                            forms.push({
                                ...f,
                                color: formsColors[i],
                            });
                        });
                        this.props.setCurrentForms(forms);
                    });
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
        const currentOrgUnit = {
            ...this.state.currentOrgUnit,
            [key]: value,
        };
        if (key !== 'geo_json' && value) {
            currentOrgUnit.latitude = null;
            currentOrgUnit.longitude = null;
        }
        this.setState({
            orgUnitModified: key !== 'geo_json',
            currentOrgUnit,
        });
    }

    handleChangeLocation(location) {
        this.setState({
            orgUnitLocationModified: true,
            currentOrgUnit: {
                ...this.state.currentOrgUnit,
                latitude: location.lat ? parseFloat(location.lat.toFixed(8)) : null,
                longitude: location.lng ? parseFloat(location.lng.toFixed(8)) : null,
                geo_json: null,
            },
        });
    }

    saveOrgUnit() {
        saveOrgUnit(this.props.dispatch, this.state.currentOrgUnit).then(
            (currentOrgUnit) => {
                this.setState({
                    orgUnitModified: false,
                    orgUnitLocationModified: false,
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
            orgUnitLocationModified: false,
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
            sources,
            params,
            router,
            prevPathname,
            redirectToPush,
        } = this.props;
        const {
            tab,
            currentOrgUnit,
            orgUnitModified,
            orgUnitLocationModified,
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
                    goBack={() => {
                        if (prevPathname) {
                            router.goBack();
                        } else {
                            redirectToPush('orgunits', {});
                        }
                    }}
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
                            {
                                tab === 'infos' && (
                                    <Box className={classes.containerFullHeightPadded}>
                                        <OrgUnitInfos
                                            params={params}
                                            baseUrl={baseUrl}
                                            orgUnit={currentOrgUnit}
                                            orgUnitTypes={orgUnitTypes}
                                            sourceTypes={sourceTypes}
                                            sources={sources}
                                            onChangeInfo={(key, value) => this.handleChangeInfo(key, value)}
                                        />
                                        <Grid container spacing={0} alignItems="center" className={classes.marginTopBig}>
                                            <Grid xs={12} item className={classes.textAlignRight}>
                                                <Button
                                                    className={classes.marginLeft}
                                                    disabled={!orgUnitModified}
                                                    variant="contained"
                                                    onClick={() => this.resetOrgUnit()}
                                                >
                                                    <FormattedMessage id="iaso.label.cancel" defaultMessage="Cancel" />
                                                </Button>
                                                <Button
                                                    disabled={!orgUnitModified}
                                                    variant="contained"
                                                    className={classes.marginLeft}
                                                    color="primary"
                                                    onClick={() => this.saveOrgUnit(currentOrgUnit)}
                                                >
                                                    <FormattedMessage id="iaso.label.save" defaultMessage="Save" />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )
                            }
                            {
                                tab === 'map' && (
                                    <Box className={classes.containerFullHeight}>
                                        <OrgUnitMap
                                            setOrgUnitLocationModified={() => this.setOrgUnitLocationModified()}
                                            orgUnitLocationModified={orgUnitLocationModified}
                                            orgUnit={currentOrgUnit}
                                            resetOrgUnit={() => this.resetOrgUnit()}
                                            saveOrgUnit={() => this.saveOrgUnit(currentOrgUnit)}
                                            onChangeLocation={(location) => {
                                                this.handleChangeLocation(location);
                                            }}
                                            onChangeGeoJson={geoJson => this.handleChangeInfo('geo_json', geoJson)}
                                            onChangeCatchment={catchment => this.handleChangeInfo('catchment', catchment)}
                                        />
                                    </Box>
                                )
                            }
                            {
                                tab === 'history' && (
                                    <Box className={classes.containerFullHeightPadded}>
                                        <Logs
                                            params={params}
                                            logObjectId={currentOrgUnit.id}
                                            goToRevision={orgUnitRevision => this.goToRevision(orgUnitRevision)}
                                        />
                                    </Box>
                                )
                            }
                        </section>
                    )
                }
            </Fragment>
        );
    }
}
OrgUnitDetail.defaultProps = {
    currentOrgUnit: undefined,
    sources: [],
    prevPathname: null,
};

OrgUnitDetail.propTypes = {
    router: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    setCurrentOrgUnit: PropTypes.func.isRequired,
    setCurrentForms: PropTypes.func.isRequired,
    setOrgUnitTypes: PropTypes.func.isRequired,
    setSourceTypes: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object,
    redirectTo: PropTypes.func.isRequired,
    redirectToPush: PropTypes.func.isRequired,
    fetching: PropTypes.bool.isRequired,
    fetchingSubOrgUnits: PropTypes.bool.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
    dispatch: PropTypes.func.isRequired,
    resetOrgUnits: PropTypes.func.isRequired,
    resetOrgUnitsLevels: PropTypes.func.isRequired,
    setSources: PropTypes.func.isRequired,
    sources: PropTypes.array,
    prevPathname: PropTypes.any,
};

const MapStateToProps = state => ({
    fetching: state.orgUnits.fetchingDetail,
    fetchingSubOrgUnits: state.orgUnits.fetchingSubOrgUnits,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
    currentForms: state.orgUnits.currentForms,
    sourceTypes: state.orgUnits.sourceTypes,
    sources: state.orgUnits.sources,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentOrgUnit: orgUnit => dispatch(setCurrentOrgUnit(orgUnit)),
    setOrgUnitTypes: orgUnitTypes => dispatch(setOrgUnitTypes(orgUnitTypes)),
    setCurrentForms: currentForms => dispatch(setCurrentForms(currentForms)),
    setSourceTypes: sourceTypes => dispatch(setSourceTypes(sourceTypes)),
    redirectTo: (key, params) => dispatch(replace(`${key}${createUrl(params, '')}`)),
    redirectToPush: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
    resetOrgUnits: () => dispatch(resetOrgUnits()),
    resetOrgUnitsLevels: () => dispatch(resetOrgUnitsLevels()),
    setSources: sources => dispatch(setSources(sources)),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(OrgUnitDetail)),
);
