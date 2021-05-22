import React from 'react';

class ErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        // eslint-disable-next-line no-console
        console.log('BOUNDARY ERROR', error, errorInfo);
    }

    render() {
        // eslint-disable-next-line react/prop-types
        return this.props.children;
    }
}

export { ErrorBoundary };
