import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

class SearchButton extends Component {
    render() {
        const { onSearch } = this.props;
        return (
            <div className="widget__content align-right no-padding-top">
                <button
                    onClick={() => onSearch()}
                    className="button--save--tiny"
                >
                    <i className="fa fa-search" aria-hidden="true" />
                    <FormattedMessage
                        id="main.label.search"
                        defaultMessage="Search"
                    />
                </button>
            </div>
        );
    }
}

SearchButton.propTypes = {
    onSearch: PropTypes.func.isRequired,
};

export default injectIntl(SearchButton);
