import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@material-ui/core';
import InputComponent from '../../../../components/forms/InputComponent';

const Checkboxes = ({ checkboxes, inline }) => {
    const style = inline ? { display: 'inlineFlex' } : { display: 'grid' };
    const boxes = checkboxes.map(checkbox => (
        <InputComponent
            key={checkbox.keyValue}
            keyValue={checkbox.keyValue}
            label={checkbox.label}
            value={checkbox.value}
            onChange={(_, value) => {
                checkbox.onChange(value);
            }}
            type="checkbox"
            clearable={false}
        />
    ));

    return <Box style={style}>{boxes}</Box>;
};

Checkboxes.defaultProps = {
    inline: false,
};

Checkboxes.propTypes = {
    checkboxes: PropTypes.array.isRequired,
    inline: PropTypes.bool,
};
export { Checkboxes };
