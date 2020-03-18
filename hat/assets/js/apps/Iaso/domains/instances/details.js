import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, FormattedMessage } from 'react-intl';
import { bindActionCreators } from 'redux';

import {
    withStyles,
    Box,
    Grid,
    Paper,
    Divider,
    Typography,
    Tooltip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TableHead,
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
        padding: theme.spacing(2),
        display: 'flex',
    },
    paperContent: {
        padding: theme.spacing(2),
    },
    label: {
        fontWeight: 'bold',
    },
    downloadLinkContainer: {
        position: 'relative',
    },
    downloadLink: {
        position: 'absolute',
        right: -theme.spacing(2),
        top: -theme.spacing(1),
    },
    icon: {
        width: 30,
        height: 'auto',
        display: 'block',
        cursor: 'pointer',
    },
    tableCellHead: {
        fontWeight: 'bold',
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
    },
    tableCell: {
        backgroundColor: 'transparent',
        borderTop: 'none !important',
        borderLeft: 'none !important',
        borderRight: 'none !important',
        borderBottom: `1px solid ${theme.palette.ligthGray.border}  !important`,
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
                            <Grid container spacing={4}>
                                <Grid xs={12} md={5} item>
                                    <Paper elevation={1}>
                                        <Typography
                                            className={classes.paperTitle}
                                            color="primary"
                                            variant="h5"
                                        >
                                            {formatMessage(MESSAGES.infos)}
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

                                <Grid xs={12} md={7} item>
                                    <Paper elevation={1}>
                                        <div className={classes.paperTitle}>
                                            <Grid xs={10} item>
                                                <Typography
                                                    color="primary"
                                                    variant="h5"
                                                >
                                                    {formatMessage(MESSAGES.form)}
                                                </Typography>
                                            </Grid>
                                            <Grid xs={2} item container justify="flex-end" className={classes.downloadLinkContainer}>
                                                <Tooltip
                                                    className={classes.downloadLink}
                                                    title={<FormattedMessage id="iaso.label.download" defaultMessage="Download" />}
                                                >
                                                    <IconButton
                                                        onClick={() => window.open(currentInstance.file_url, '_blank')}
                                                    >
                                                        <XmlSvg color="secondary" className={classes.icon} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Grid>
                                        </div>
                                        <Divider />
                                        <div>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell width={150} className={classes.tableCellHead}>
                                                            <FormattedMessage id="iaso.label.field" defaultMessage="Field" />
                                                        </TableCell>
                                                        <TableCell width={150} align="right" className={classes.tableCellHead}>
                                                            <FormattedMessage id="iaso.label.key" defaultMessage="Key" />
                                                        </TableCell>
                                                        <TableCell width={250} align="right" className={classes.tableCellHead}>
                                                            <FormattedMessage id="iaso.label.value" defaultMessage="Value" />
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {
                                                        Object.keys(currentInstance.file_content).map((k) => {
                                                            if (k !== 'meta' && k !== 'uuid') {
                                                                return (
                                                                    <TableRow key={k}>
                                                                        {/* TO-DO: get field label from API */}
                                                                        <TableCell className={classes.tableCell}>{k}</TableCell>
                                                                        <TableCell className={classes.tableCell} align="right">{k}</TableCell>
                                                                        <TableCell className={classes.tableCell} align="right">{currentInstance.file_content[k] || '/'}</TableCell>
                                                                    </TableRow>
                                                                );
                                                            }
                                                            return null;
                                                        })
                                                    }
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Paper>
                                </Grid>
                            </Grid>
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
