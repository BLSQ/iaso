import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';


class RadiosComponent extends Component {
    changeOption(index) {
        const tempItems = this.props.items.slice();
        tempItems[index].isActive = !tempItems[index].isActive;
        this.props.showItems(tempItems);
    }

    render() {
        return (
            <div>
                {
                    this.props.items.map((item, index) => {
                        const messageProps = {
                            id: item.id,
                            defaultMessage: item.defaultMessage,
                        };
                        let radioContainerClassName = item.iconClass ? ' with-icon' : '';
                        if (item.isActive) {
                            radioContainerClassName += ' checked';
                        }
                        return (
                            <div className={`custom-radio-component${radioContainerClassName}`} key={index}>
                                <input
                                    type="radio"
                                    name={`radio-${item.id}`}
                                    id={`radio-${item.id}`}
                                    checked={item.isActive ? 'checked' : ''}
                                    value={item.id}
                                    onChange={() => this.changeOption(index)}
                                />
                                <label htmlFor={`radio-${item.id}`}>
                                    <FormattedMessage {...messageProps} />
                                    {
                                        item.iconClass ? <i className={item.iconClass} /> : ''
                                    }
                                </label>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
}

RadiosComponent.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    showItems: PropTypes.func.isRequired,
};

export default injectIntl(RadiosComponent);
