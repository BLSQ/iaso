import React from 'react';
import PropTypes from 'prop-types';


class Search extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            searchString: props.searchString,
            limit: 500,
        };
    }

    componentWillReceiveProps(newProps) {
        if (newProps.searchString !== this.props.searchString || newProps.searchString === '') {
            this.setState({
                searchString: newProps.searchString,
            });
        }
    }

    componentWillUnmount() {
        this.setState({
            searchString: this.props.searchString,
            isChanged: false,
        });
        if (this.props.resetOnUnmount) {
            this.props.resetSearch();
        }
    }

    onSearch() {
        if (!this.props.disabled) {
            this.setState({
                isChanged: false,
            });
            if ((this.state.searchString !== '' && this.state.searchString.length > this.props.minCharCount)
                || this.props.allowEmptySearch) {
                this.props.onSearch(this.state.searchString, this.state.limit);
            } else {
                this.props.resetSearch();
            }
        }
    }

    onBlur(value) {
        if (this.props.searchString !== value) {
            this.onChange(value);
            this.onSearch();
        }
    }

    onChange(value) {
        if (!this.props.disabled) {
            this.setState({
                searchString: value,
                isChanged: true,
            });
            this.props.onChange(value);
        }
    }

    render() {
        const {
            results,
            isLoading,
            keys,
            showLimit,
            displayResults,
            showResetSearch,
            disabled,
            displayIcon,
            onKeyPressed,
            disableBlurSearch,
        } = this.props;
        return (
            <div className="search-container">
                <div className="search-field">
                    <input
                        type="text"
                        value={this.state.searchString}
                        disabled={disabled}
                        placeholder={this.props.placeholderText}
                        onChange={event => this.onChange(event.target.value)}
                        onBlur={(event) => {
                            if (!disableBlurSearch) { this.onBlur(event.target.value); }
                        }}
                        onKeyPress={(event) => {
                            if (event.which === 13 || event.keyCode === 13) {
                                if (onKeyPressed) {
                                    this.onBlur(event.target.value);
                                    setTimeout(() => {
                                        onKeyPressed();
                                    }, 0);
                                } else {
                                    this.onSearch();
                                }
                            }
                        }}
                    />
                    {
                        displayIcon
                        && <i className="fa fa-search" aria-hidden="true" onClick={() => this.onSearch()} />
                    }
                    {
                        showResetSearch && this.state.searchString !== ''
                        && (
                            <span
                                role="button"
                                tabIndex={0}
                                className={`Select-clear ${!displayIcon ? 'no-icon' : ''}`}
                                onClick={() => this.props.resetSearch()}
                            >
                            ×
                            </span>
                        )
                    }
                    {
                        showLimit
                        && (
                            <div className="limit-container">
                                {this.props.limitText}
:
                                <input
                                    type="number"
                                    className="small"
                                    min="0"
                                    value={this.state.limit}
                                    onChange={event => this.setState({
                                        limit: event.target.value,
                                    })}
                                    onKeyPress={(event) => {
                                        if (event.which === 13 || event.keyCode === 13) {
                                            this.onSearch();
                                        }
                                    }}
                                />
                            </div>
                        )
                    }
                </div>
                {
                    displayResults
                    && (
                        <div className="search-results">
                            {
                                results.length > 0
                            && !isLoading
                            && (
                                <section>
                                    <div>
                                        <table>
                                            <thead>
                                                <tr>
                                                    {keys.map(key => <th className={key.value} key={key.value}>{key.translation}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {
                                                    results.map(result => (
                                                        <tr key={result.id} onClick={() => this.props.onSelect(result)}>
                                                            {keys.map(key => <td className={key.value} key={key.value}>{result[key.value]}</td>)}
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                    <span className="count">
                                        {results.length}
                                        {` ${this.props.resultText}`}
                                    </span>
                                </section>
                            )
                            }
                            {
                                isLoading
                            && (
                                <div className="loading-small">
                                    <i className="fa fa-spinner" />
                                </div>
                            )
                            }
                            {
                                results.length === 0
                            && this.state.searchString.length > this.props.minCharCount
                            && !isLoading
                            && !this.state.isChanged
                            && (
                                <span className="search-empty">
                                    {this.props.noResultText}
                                </span>
                            )
                            }
                            {
                                results.length === 0
                            && this.state.searchString.length <= this.props.minCharCount
                            && this.state.searchString !== ''
                            && !isLoading
                            && (
                                <span className="search-empty">
                                    {this.props.noEnoughText}
                                </span>
                            )
                            }
                        </div>
                    )
                }
            </div>
        );
    }
}

Search.defaultProps = {
    searchString: '',
    keys: ['id'],
    results: [],
    placeholderText: 'Recherche',
    resultText: 'résultats',
    noResultText: 'Aucun résultat',
    noEnoughText: 'Minimum 2 charactères',
    limitText: 'Nombre de résultats max.',
    minCharCount: 1,
    isLoading: false,
    showLimit: false,
    allowEmptySearch: false,
    displayResults: true,
    onSelect: () => { },
    onChange: () => { },
    showResetSearch: false,
    resetOnUnmount: true,
    disabled: false,
    displayIcon: true,
    onKeyPressed: null,
    disableBlurSearch: false,
};

Search.propTypes = {
    results: PropTypes.array,
    placeholderText: PropTypes.string,
    resultText: PropTypes.string,
    noResultText: PropTypes.string,
    limitText: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    resetSearch: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    noEnoughText: PropTypes.string,
    minCharCount: PropTypes.number,
    keys: PropTypes.array,
    onSelect: PropTypes.func,
    showLimit: PropTypes.bool,
    displayResults: PropTypes.bool,
    searchString: PropTypes.string,
    allowEmptySearch: PropTypes.bool,
    showResetSearch: PropTypes.bool,
    resetOnUnmount: PropTypes.bool,
    onChange: PropTypes.func,
    disabled: PropTypes.bool,
    displayIcon: PropTypes.bool,
    onKeyPressed: PropTypes.any,
    disableBlurSearch: PropTypes.bool,
};

export default Search;
