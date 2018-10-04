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
        if (newProps.searchString !== this.props.searchString) {
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
        this.props.resetSearch();
    }

    onSearch() {
        this.setState({
            isChanged: false,
        });
        if ((this.state.searchString !== '' && this.state.searchString.length > this.props.minCharCount) ||
            this.props.allowEmptySearch) {
            this.props.onSearch(this.state.searchString, this.state.limit);
        } else {
            this.props.resetSearch();
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
        } = this.props;
        return (
            <div className="search-container">
                <div className="search-field">
                    <input
                        type="text"
                        value={this.state.searchString}
                        placeholder={this.props.placeholderText}
                        onChange={event =>
                            this.setState({
                                searchString: event.target.value,
                                isChanged: true,
                            })}
                        onKeyPress={(event) => {
                            if (event.which === 13 || event.keyCode === 13) {
                                this.onSearch();
                            }
                        }}
                    />
                    <i className="fa fa-search" aria-hidden="true" onClick={() => this.onSearch()} />
                    {
                        showResetSearch && this.state.searchString !== '' &&
                        <span
                            role="button"
                            tabIndex={0}
                            className="Select-clear"
                            onClick={() => this.props.resetSearch()}
                        >
                            ×
                        </span>
                    }
                    {
                        showLimit &&
                        <div className="limit-container">
                            {this.props.limitText}:
                            <input
                                type="number"
                                className="small"
                                min="0"
                                value={this.state.limit}
                                onChange={event =>
                                    this.setState({
                                        limit: event.target.value,
                                    })}
                                onKeyPress={(event) => {
                                    if (event.which === 13 || event.keyCode === 13) {
                                        this.onSearch();
                                    }
                                }}
                            />
                        </div>
                    }
                </div>
                {
                    displayResults &&
                    <div className="search-results">
                        {
                            results.length > 0 &&
                            !isLoading &&
                            <section>
                                <div>
                                    <table>
                                        <thead>
                                            <tr>
                                                {keys.map(key =>
                                                    <th className={key.value} key={key.value}>{key.translation}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {
                                                results.map(result =>
                                                    (
                                                        <tr key={result.id} onClick={() => this.props.onSelect(result)}>
                                                            {keys.map(key =>
                                                                <td className={key.value} key={key.value}>{result[key.value]}</td>)}
                                                        </tr>
                                                    ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                                <span className="count">
                                    {results.length}{` ${this.props.resultText}`}
                                </span>
                            </section>
                        }
                        {
                            isLoading &&
                            <div className="loading-small">
                                <i className="fa fa-spinner" />
                            </div>
                        }
                        {
                            results.length === 0 &&
                            this.state.searchString.length > this.props.minCharCount &&
                            !isLoading &&
                            !this.state.isChanged &&
                            <span className="search-empty">
                                {this.props.noResultText}
                            </span>
                        }
                        {
                            results.length === 0 &&
                            this.state.searchString.length <= this.props.minCharCount &&
                            this.state.searchString !== '' &&
                            !isLoading &&
                            <span className="search-empty">
                                {this.props.noEnoughText}
                            </span>
                        }
                    </div>
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
    showResetSearch: false,
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
};

export default Search;
