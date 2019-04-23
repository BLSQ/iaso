import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { userHasPermission } from '../utils';

class downloadComponent extends Component {
    constructor(props) {
        super(props);
        const { currentUser, permissions } = props;
        this.state = {
            downloadEnabled: currentUser && permissions ?
                userHasPermission(permissions, currentUser, 'x_datas_download') : false,
        };
    }

    componentWillReceiveProps(nextProps) {
        const { currentUser, permissions } = nextProps;
        this.setState({
            downloadEnabled: userHasPermission(permissions, currentUser, 'x_datas_download'),
        });
    }

    render() {
        const {
            csvUrl,
            xlsxUrl,
            smallButtons,
        } = this.props;

        if (!this.state.downloadEnabled) {
            return null;
        }

        return (
            <span>
                <button
                    className={`button${smallButtons ? '--tiny' : ''} margin`}
                    onClick={() => {
                        window.location.href = csvUrl;
                    }}
                >
                    <i className="fa fa-download" />
                    CSV
                </button>
                <button
                    className={`button${smallButtons ? '--tiny' : ''} margin-right`}
                    onClick={() => {
                        window.location.href = xlsxUrl;
                    }}
                >
                    <i className="fa fa-file-excel-o" />
                    XLSX
                </button>
            </span>
        );
    }
}
downloadComponent.defaultProps = {
    csvUrl: '',
    xlsxUrl: '',
    smallButtons: false,
};

downloadComponent.propTypes = {
    csvUrl: PropTypes.string,
    xlsxUrl: PropTypes.string,
    smallButtons: PropTypes.bool,
    currentUser: PropTypes.object.isRequired,
    permissions: PropTypes.array.isRequired,
};

const MapStateToProps = state => ({
    currentUser: state.currentUser.user,
    permissions: state.currentUser.permissions,
});

export default connect(MapStateToProps)(downloadComponent);
