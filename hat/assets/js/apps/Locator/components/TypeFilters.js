import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import VillageTypesConstant from '../../../utils/constants/VillageTypesConstant';

class typeFilters extends React.Component {
    render() {
        return (
            <div className="type-filters-containers">
                <ul>
                    {
                        Object.entries(VillageTypesConstant).map((villageType) => {
                            const messageProps = {
                                id: villageType[1].translationKey,
                                defaultMessage: villageType[1].defaultMessage,
                            };
                            return (
                                <li
                                    onKeyDown={() => { }}
                                    key={villageType[0]}
                                    className={`${villageType[0]} ${this.props.currentTypes.indexOf(villageType[1].key) > -1 ? 'active' : ''}`}
                                    onClick={() => this.props.selectType(villageType[1].key)}
                                >

                                    <FormattedMessage
                                        {...messageProps}
                                    />
                                </li>
                            );
                        })
                    }
                </ul>
            </div>
        );
    }
}

typeFilters.propTypes = {
    currentTypes: PropTypes.array.isRequired,
    selectType: PropTypes.func.isRequired,
};

export default injectIntl(typeFilters);
