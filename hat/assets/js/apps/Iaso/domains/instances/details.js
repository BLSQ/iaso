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
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import WidgetPaper from '../../components/papers/WidgetPaperComponent';

import InstanceDetailsInfos from './components/InstanceDetailsInfos';
import InstanceDetailsLocation from './components/InstanceDetailsLocation';
import InstancesFilesList from './components/InstancesFilesListComponent';
import InstanceFileContent from './components/InstanceFileContent';

import {
    getInstancesFilesList,
} from './utils';

import MESSAGES from './messages';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
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
                                        <InstanceDetailsInfos currentInstance={currentInstance} />
                                    </WidgetPaper>
                                    <WidgetPaper
                                        title={formatMessage(MESSAGES.location)}
                                    >
                                        <InstanceDetailsLocation currentInstance={currentInstance} />
                                    </WidgetPaper>
                                    {
                                        currentInstance.files.length > 0
                                        && (
                                            <WidgetPaper
                                                title={formatMessage(MESSAGES.files)}
                                                padded
                                            >
                                                <InstancesFilesList
                                                    fetchDetails={false}
                                                    instanceDetail={currentInstance}
                                                    files={getInstancesFilesList([currentInstance])}
                                                />
                                            </WidgetPaper>
                                        )
                                    }
                                </Grid>

                                <Grid xs={12} md={7} item>
                                    <WidgetPaper
                                        title={formatMessage(MESSAGES.form)}
                                        IconButton={IconButtonComponent}
                                        iconButtonProps={
                                            {
                                                onClick: () => window.open(currentInstance.file_url, '_blank'),
                                                icon: 'xml',
                                                color: 'secondary',
                                                tooltipMessage: { id: 'iaso.label.downloadXml', defaultMessage: 'Download XML' },
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
