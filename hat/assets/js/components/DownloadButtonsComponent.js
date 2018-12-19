import React, { Component } from 'react';
import PropTypes from 'prop-types';

class downloadComponent extends Component {
    render() {
        const {
            csvUrl,
            xlsxUrl,
            smallButtons,
        } = this.props;
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
};

export default downloadComponent;
