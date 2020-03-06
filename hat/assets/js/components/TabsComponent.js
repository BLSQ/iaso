import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createUrl } from '../utils/fetchData';

class TabsComponent extends Component {
    constructor(props) {
        super(props);
        let activeTab = props.params.tab ? props.params.tab : props.defaultSelect;
        if (props.currentTab !== '') {
            activeTab = props.currentTab;
        }
        this.props.selectTab(activeTab);
        this.state = {
            currentTab: activeTab,
        };
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.tab !== this.props.params.tab) {
            const currentTab = newProps.params.tab ? newProps.params.tab : newProps.defaultSelect;
            this.props.selectTab(currentTab);
            this.setState({
                currentTab,
            });
        } else if ((newProps.currentTab !== '') && (newProps.currentTab !== this.props.currentTab)) {
            this.props.selectTab(newProps.currentTab);
            this.setState({
                currentTab: newProps.currentTab,
            });
        }
    }

    onSelect(key) {
        const { params, defaultPath, isRedirecting } = this.props;
        this.props.selectTab(key);
        if (isRedirecting) {
            this.props.redirectTo(defaultPath, {
                ...params,
                tab: key, // don't forget to put this param in react router
            });
        }
    }

    render() {
        const { tabs } = this.props;

        return (
            <ul className="tabs-container">
                {
                    tabs.map((t) => {
                        if (t.disabled) {
                            return (
                                <li
                                    className="disabled"
                                    key={t.key}
                                    onClick={() => null}
                                >
                                    {t.label}
                                </li>
                            );
                        }
                        return (
                            <li
                                className={this.state.currentTab === t.key ? 'selected' : ''}
                                key={t.key}
                                onClick={() => this.onSelect(t.key)}
                            >
                                {t.label}
                            </li>
                        );
                    })
                }
            </ul>
        );
    }
}
const MapStateToProps = state => ({
    config: state.config,
});
TabsComponent.defaultProps = {
    defaultPath: '',
    defaultSelect: '',
    redirectTo: () => { },
    params: {},
    isRedirecting: true,
    currentTab: '',
};

TabsComponent.propTypes = {
    tabs: PropTypes.array.isRequired,
    selectTab: PropTypes.func.isRequired,
    defaultSelect: PropTypes.string,
    params: PropTypes.object,
    redirectTo: PropTypes.func,
    defaultPath: PropTypes.string,
    isRedirecting: PropTypes.bool,
    currentTab: PropTypes.string,
};
const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(TabsComponent);
