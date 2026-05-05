import React, { FunctionComponent } from 'react';

type Props = {
    errors: string[];
};

export const ErrorFieldText: FunctionComponent<Props> = ({ errors }) => {
    if (errors.length === 1) {
        return <span>{errors[0]}</span>;
    }
    return (
        <ul style={{ margin: 0, padding: 0 }}>
            {errors.map((error: string) => (
                <li key={error}>{error}</li>
            ))}
        </ul>
    );
};
