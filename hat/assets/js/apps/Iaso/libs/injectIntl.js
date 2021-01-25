import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

const FakeComponent = props => {
    const Component = props.component;
    const intl = useIntl();
    const intlCopy = { ...intl };
    const formatMessage = message => {
        if (message && message.id && message.defaultMessage) {
            return intlCopy.formatMessage(message);
        }
        console.warn('Warning: Message object is not defined properly!');
        return null;
    };
    intl.formatMessage = formatMessage;
    return <Component {...props} intl={intl} forwardedRef={props.ref} />;
};

FakeComponent.defaultProps = {
    ref: undefined,
};

FakeComponent.propTypes = {
    component: PropTypes.any.isRequired,
    ref: PropTypes.object,
};

const newInjectIntl = Component => {
    return React.forwardRef((props, ref) => {
        const propsCopy = {
            ...props,
            component: Component,
            ref,
        };
        return <FakeComponent {...propsCopy} />;
    });
};
export default newInjectIntl;
