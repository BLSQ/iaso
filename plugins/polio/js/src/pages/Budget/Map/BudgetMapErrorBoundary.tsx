import React from 'react';
// @ts-ignore
import { ErrorBoundary } from 'bluesquare-components';

class BudgetMapErrorBoundary extends ErrorBoundary {
    render() {
        if (this.state.hasError) {
            return <h1>An exception occurred</h1>;
        }
        return this.props.children;
    }
}

export { BudgetMapErrorBoundary };
