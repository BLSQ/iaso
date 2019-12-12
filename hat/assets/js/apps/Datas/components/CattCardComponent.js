import React from 'react';

import PropTypes from 'prop-types';

const cattMaxIndex = 10;

const CattCardComponent = ({
    cattIndex,
    onChange,
    isRequired,
}) => (
    <div>
        <ul className={`catt-card ${isRequired && !cattIndex ? 'error' : null}`}>
            {
                Array(cattMaxIndex).fill().map((_, i) => (
                    <li
                        className={cattIndex === (i + 1) ? 'selected' : ''}
                        key={i}
                        onClick={() => onChange(i + 1)}
                    >
                        {i + 1}
                    </li>
                ))
            }
        </ul>

    </div>
);

CattCardComponent.defaultProps = {
    cattIndex: null,
    isRequired: false,
};

CattCardComponent.propTypes = {
    cattIndex: PropTypes.number,
    onChange: PropTypes.func.isRequired,
    isRequired: PropTypes.bool,
};


export default CattCardComponent;
