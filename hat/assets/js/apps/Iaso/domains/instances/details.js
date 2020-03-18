import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';

import {
    withStyles, Box, Grid, Paper, Divider, Typography, Link,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    setCurrentInstance as setCurrentInstanceAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
} from './actions';
import {
    redirectTo as redirectToAction,
    redirectToReplace as redirectToReplaceAction,
} from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import XmlSvg from '../../components/svg/XmlSvgComponent';
import InstanceDetailsField from './components/InstanceDetailsField';
import { displayDateFromTimestamp } from '../../utils/intlUtil';
import MESSAGES from './messages';
import { Period } from '../periods/models';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    paperTitle: {
        padding: theme.spacing(2, 4),
    },
    paperContent: {
        padding: theme.spacing(4),
    },
    label: {
        fontWeight: 'bold',
    },
    icon: {
        width: 65,
        height: 'auto',
        display: 'block',
        cursor: 'pointer',
    },
});

class InstanceDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
        props.setCurrentInstance(null);
    }

    componentDidMount() {
        const {
            params: {
                instanceId,
            },
            fetchInstanceDetail,
        } = this.props;
        fetchInstanceDetail(instanceId);
    }

    render() {
        const {
            classes,
            fetching,
            currentInstance,
            intl: {
                formatMessage,
            },
            router,
            prevPathname,
            redirectToReplace,
        } = this.props;
        return (
            <section className={classes.relativeContainer}>
                <TopBar
                    title={currentInstance
                        ? `${currentInstance.form_name}: ${currentInstance.file_name.replace('.xml', '')}`
                        : ''}
                    displayBackButton
                    goBack={() => {
                        if (prevPathname || !currentInstance) {
                            router.goBack();
                        } else {
                            redirectToReplace('instances', {
                                formId: currentInstance.form_id,
                            });
                        }
                    }}
                />
                {
                    fetching
                    && <LoadingSpinner />
                }
                {
                    currentInstance
                    && (
                        <Box className={classes.containerFullHeightNoTabPadded}>
                            <Grid container spacing={0} className={classes.marginBottom}>
                                <Grid xs={9} lg={5} item>
                                    <Paper elevation={1}>
                                        <Typography
                                            className={classes.paperTitle}
                                            color="primary"
                                            variant="h5"
                                        >
                                            {formatMessage(MESSAGES.metas)}
                                        </Typography>
                                        <Divider />
                                        <div className={classes.paperContent}>
                                            <InstanceDetailsField
                                                label="Id"
                                                value={currentInstance.id}
                                            />
                                            <InstanceDetailsField
                                                label="Uuid"
                                                value={currentInstance.uuid}
                                            />
                                            <InstanceDetailsField
                                                label={formatMessage(MESSAGES.updated_at)}
                                                value={displayDateFromTimestamp(currentInstance.updated_at)}
                                            />
                                            <InstanceDetailsField
                                                label={formatMessage(MESSAGES.created_at)}
                                                value={displayDateFromTimestamp(currentInstance.created_at)}
                                            />
                                            <InstanceDetailsField
                                                label={formatMessage(MESSAGES.org_unit)}
                                                value={currentInstance.org_unit
                                                    ? `${currentInstance.org_unit.name} (${currentInstance.org_unit.org_unit_type_name})`
                                                    : '/'}
                                            />
                                            <InstanceDetailsField
                                                label={formatMessage(MESSAGES.period)}
                                                value={currentInstance.period
                                                    ? `${Period.getPrettyPeriod(currentInstance.period)}`
                                                    : '/'}
                                            />
                                        </div>
                                    </Paper>
                                </Grid>

                                <Grid xs={3} lg={7} item container justify="flex-end">
                                    <Link
                                        onClick={() => window.open(currentInstance.file_url, '_blank')}
                                        size="small"
                                    >
                                        <XmlSvg color="secondary" className={classes.icon} />
                                    </Link>
                                </Grid>
                            </Grid>
                            <Paper elevation={1}>
                                <Typography
                                    className={classes.paperTitle}
                                    color="primary"
                                    variant="h5"
                                >
                                    {formatMessage(MESSAGES.form)}
                                </Typography>
                                <Divider />
                                <div className={classes.paperContent}>
                                    {
                                        Object.keys(currentInstance.file_content).map((k) => {
                                            if (k !== 'meta' && k !== 'uuid') {
                                                return (
                                                    <InstanceDetailsField
                                                        label={k} // TO-DO: get field label from API
                                                        value={currentInstance.file_content[k] || '/'}
                                                    />
                                                );
                                            }
                                            return null;
                                        })
                                    }
                                </div>
                            </Paper>
                        </Box>
                    )
                }
            </section>
        );
    }
}
InstanceDetails.defaultProps = {
    prevPathname: null,
    currentInstance: null,
};

InstanceDetails.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    fetching: PropTypes.bool.isRequired,
    router: PropTypes.object.isRequired,
    redirectToReplace: PropTypes.func.isRequired,
    prevPathname: PropTypes.any,
    currentInstance: PropTypes.object,
    fetchInstanceDetail: PropTypes.func.isRequired,
    setCurrentInstance: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    fetching: state.instances.fetching,
    currentInstance: state.instances.current,
    prevPathname: state.routerCustom.prevPathname,
});

const MapDispatchToProps = dispatch => ({
    ...bindActionCreators({
        fetchInstanceDetail: fetchInstanceDetailAction,
        redirectTo: redirectToAction,
        redirectToReplace: redirectToReplaceAction,
        setCurrentInstance: setCurrentInstanceAction,
    }, dispatch),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstanceDetails)),
);
