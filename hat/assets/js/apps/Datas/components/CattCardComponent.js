import React from 'react';

import PropTypes from 'prop-types';

const cattMaxIndex = 10;

const CattCardComponent = ({
    cattIndex,
    onChange,
}) => (
    <div>
        <ul className="catt-card">
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

CattCardComponent.propTypes = {
    cattIndex: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
};


export default CattCardComponent;
