import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { bindActionCreators } from 'redux';

import {
    withStyles, Box,
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

import commonStyles from '../../styles/common';


const baseUrl = 'instance';

const styles = theme => ({
    ...commonStyles(theme),
});


class InstanceDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
        };
    }

    componentWillMount() {
        this.props.setCurrentInstance(null);
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
                            {currentInstance.uuid}
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
    redirectTo: PropTypes.func.isRequired,
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
