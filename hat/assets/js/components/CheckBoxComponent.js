import React, { Fragment } from 'react';
import { injectIntl } from 'react-intl';

import CheckBox from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';
import PropTypes from 'prop-types';

function CheckBoxComponent(props) {
    const {
        isChecked,
        isDisabled,
        keyValue,
        labelObj,
        toggleCheckbox,
        intl: {
            formatMessage,
        },
        labelClassName,
        showSemicolon,
    } = props;
    return (
        <Fragment>
            <span className="check-box__container">
                <label htmlFor={`checkbox-${keyValue}`} className={labelClassName}>
                    {formatMessage(labelObj)}
                    {showSemicolon ? ':' : ''}
                </label>
                <span>
                    {
                        isChecked
                        && (
                            <CheckBox
                                className="check-box__icon"
                                color={!isDisabled ? 'primary' : 'inherit'}
                            />
                        )
                    }
                    {
                        !isChecked
                        && (
                            <CheckBoxOutlineBlank
                                className="check-box__icon not-checked"
                            />
                        )
                    }
                    <input
                        disabled={isDisabled !== undefined ? isDisabled : false}
                        id={`checkbox-${keyValue}`}
                        type="checkbox"
                        name={`checkbox-${keyValue}`}
                        className={`check-box__input_hidden ${isDisabled ? 'disabled' : ''}`}
                        checked={isChecked}
                        onChange={() => toggleCheckbox(!isChecked, keyValue)}
                    />
                </span>
            </span>
        </Fragment>
    );
}

CheckBoxComponent.defaultProps = {
    isChecked: false,
    isDisabled: false,
    showSemicolon: false,
    keyValue: '',
    labelClassName: '',
};

CheckBoxComponent.propTypes = {
    isChecked: PropTypes.bool,
    isDisabled: PropTypes.bool,
    showSemicolon: PropTypes.bool,
    keyValue: PropTypes.string,
    labelObj: PropTypes.object.isRequired,
    toggleCheckbox: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    labelClassName: PropTypes.string,
};


export default injectIntl(CheckBoxComponent);
