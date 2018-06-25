import React from 'react';
import PropTypes from 'prop-types';


class Search extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            searchString: '',
        };
    }

    componentWillUnmount() {
        this.setState({
            searchString: '',
            isChanged: false,
        });
        this.props.resetSearch();
    }

    onSearch() {
        this.setState({
            isChanged: false,
        });
        if (this.state.searchString !== '' && this.state.searchString.length > this.props.minCharCount) {
            this.props.onSearch(this.state.searchString);
        } else {
            this.props.resetSearch();
        }
    }

    onChange(value) {
        this.setState({
            searchString: value,
            isChanged: true,
        });
    }

    render() {
        const { results, isLoading, keys } = this.props;
        return (
            <div className="search-container">
                <div className="search-field">
                    <input
                        type="text"
                        value={this.state.searchString}
                        placeholder={this.props.placeholderText}
                        onChange={event => this.onChange(event.target.value)}
                        onKeyPress={(event) => {
                            if (event.which === 13 || event.keyCode === 13) {
                                this.onSearch();
                            }
                        }}
                    />
                    <i className="fa fa-search" aria-hidden="true" onClick={() => this.onSearch()} />
                </div>
                <div className="search-results">
                    {
                        results.length > 0 &&
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
                            <span className="count">{results.length}{` ${this.props.resultText}`}</span>
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
            </div>
        );
    }
}

Search.defaultProps = {
    keys: ['id'],
    results: [],
    placeholderText: 'Recherche',
    resultText: 'résultats',
    noResultText: 'Aucun résultat',
    noEnoughText: 'Minimum 2 charactères',
    minCharCount: 1,
    isLoading: false,
};

Search.propTypes = {
    results: PropTypes.array,
    placeholderText: PropTypes.string,
    resultText: PropTypes.string,
    noResultText: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    resetSearch: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    noEnoughText: PropTypes.string,
    minCharCount: PropTypes.number,
    keys: PropTypes.array,
    onSelect: PropTypes.func.isRequired,
};

export default Search;
