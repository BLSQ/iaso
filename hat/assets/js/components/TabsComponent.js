import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import { createUrl } from '../utils/fetchData';

class TabsComponent extends Component {
    constructor(props) {
        super(props);
        const currentTab = props.params.tab ? props.params.tab : props.defaultSelect;
        this.props.selectTab(currentTab);
        this.state = {
            currentTab,
        };
    }

    componentWillReceiveProps(newProps) {
        if (newProps.params.tab !== this.props.params.tab) {
            const currentTab = newProps.params.tab ? newProps.params.tab : newProps.defaultSelect;
            this.props.selectTab(currentTab);
            this.setState({
                currentTab,
            });
        }
    }

    onSelect(key) {
        const { params, defaultPath } = this.props;
        this.props.selectTab(key);
        this.props.redirectTo(defaultPath, {
            ...params,
            tab: key, // don't forget to put this param in react router
        });
    }

    render() {
        const { tabs } = this.props;

        return (
            <ul className="tabs-container">
                {
                    tabs.map(t => (
                        <li
                            className={this.state.currentTab === t.key ? 'selected' : ''}
                            key={t.label}
                            onClick={() => this.onSelect(t.key)}
                        >
                            {t.label}
                        </li>
                    ))
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
};

TabsComponent.propTypes = {
    tabs: PropTypes.array.isRequired,
    selectTab: PropTypes.func.isRequired,
    defaultSelect: PropTypes.string,
    params: PropTypes.object.isRequired,
    redirectTo: PropTypes.func.isRequired,
    defaultPath: PropTypes.string,
};
const MapDispatchToProps = dispatch => ({
    dispatch,
    redirectTo: (key, params) => dispatch(push(`${key}${createUrl(params, '')}`)),
});

export default connect(MapStateToProps, MapDispatchToProps)(TabsComponent);
