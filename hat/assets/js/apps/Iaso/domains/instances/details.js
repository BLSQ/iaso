import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';

import {
    withStyles,
    Box,
    Grid,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import {
    setCurrentInstance as setCurrentInstanceAction,
    fetchInstanceDetail as fetchInstanceDetailAction,
} from './actions';
import {
    redirectToReplace as redirectToReplaceAction,
} from '../../routing/actions';

import TopBar from '../../components/nav/TopBarComponent';
import LoadingSpinner from '../../components/LoadingSpinnerComponent';
import XmlButton from '../../components/buttons/XmlButtonComponent';
import MarkerMap from '../../components/maps/MarkerMapComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';

import InstanceFileContent from './components/InstanceFileContent';
import InstanceDetailsField from './components/InstanceDetailsField';

import { INSTANCE_METAS_FIELDS } from './constants';
import MESSAGES from './messages';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    icon: {
        width: 30,
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
                            <Grid container spacing={4}>
                                <Grid xs={12} md={5} item>
                                    <WidgetPaper
                                        title={formatMessage(MESSAGES.infos)}
                                        padded
                                    >

                                        {
                                            INSTANCE_METAS_FIELDS.map(f => (
                                                <InstanceDetailsField
                                                    key={f.key}
                                                    label={formatMessage(MESSAGES[f.key])}
                                                    value={f.render ? f.render(currentInstance[f.key]) : currentInstance[f.key]}
                                                />
                                            ))
                                        }
                                    </WidgetPaper>
                                    {
                                        currentInstance.latitude
                                        && currentInstance.longitude
                                        && (
                                            <WidgetPaper
                                                title={formatMessage(MESSAGES.location)}
                                            >
                                                <MarkerMap latitude={currentInstance.latitude} longitude={currentInstance.longitude} />
                                            </WidgetPaper>
                                        )
                                    }
                                </Grid>

                                <Grid xs={12} md={7} item>
                                    <WidgetPaper
                                        title={formatMessage(MESSAGES.form)}
                                        IconButton={XmlButton}
                                        iconButtonProps={
                                            {
                                                onClick: () => window.open(currentInstance.file_url, '_blank'),
                                                iconProps: {
                                                    className: classes.icon,
                                                    color: 'secondary',
                                                },
                                            }
                                        }
                                    >
                                        <InstanceFileContent fileContent={currentInstance.file_content} />
                                    </WidgetPaper>
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
        redirectToReplace: redirectToReplaceAction,
        setCurrentInstance: setCurrentInstanceAction,
    }, dispatch),
});


export default withStyles(styles)(
    connect(MapStateToProps, MapDispatchToProps)(injectIntl(InstanceDetails)),
);
