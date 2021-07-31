import React from 'react';
import PropTypes from 'prop-types';

// cf https://reactjs.org/docs/error-boundaries.html
// FIXME see if merge with the one in bluesquare-component?

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('BOUNDARY ERROR', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <h1>An exception occurred: {this.state.error.toString()}</h1>
            );
        }
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
};
export { ErrorBoundary };
