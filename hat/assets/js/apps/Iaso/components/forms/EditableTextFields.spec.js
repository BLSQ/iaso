import React from 'react';
import { EditableTextFields } from './EditableTextFields';
import { renderWithIntl } from '../../../../test/utils/intl';
import InputComponent from './InputComponent';

const onChange1 = sinon.spy();
const onChange2 = sinon.spy();

const initialValues = ['initialValue1', 'initialValue2'];
const updatedValues = ['newValue1', 'newValue2'];
const updaters = [onChange1, onChange2];

const defaultProps = [
    {
        keyValue: 'keyValue',
        label: { id: 'label', defaultMessage: 'label' },
        value: initialValues[0],
        onChange: updaters[0],
    },
    {
        keyValue: 'keyValue2',
        password: true,
        label: { id: 'label2', defaultMessage: 'label2' },
        value: initialValues[1],
        onChange: updaters[1],
    },
];

// const updatedProps = [
//     {
//         keyValue: 'keyValue',
//         type: 'text',
//         label: { id: 'label', defaultMessage: 'label' },
//         value: 'BROL',
//         onChange: onChangeSpy,
//     },
//     {
//         keyValue: 'keyValue2',
//         type: 'text2',
//         label: { id: 'label2', defaultMessage: 'label2' },
//         value: 'value2',
//         onChange: () => {},
//     },
// ];

let component;
let inputs;

const renderComponent = props => {
    return mount(renderWithIntl(<EditableTextFields fields={props} />));
};

describe.only('EditableTextFields', () => {
    beforeEach(() => {
        component = renderComponent(defaultProps);
        inputs = component.find('input');
    });
    it('renders', () => {
        expect(component.exists()).to.equal(true);
        expect(inputs.length).to.equal(2);
    });
    it('onChange', async () => {
        for (let i = 0; i < inputs.length; i += 1) {
            const input = component.find('input').at(i);
            input.simulate('change', {
                target: { value: updatedValues[i] },
            });
            expect(updaters[i]).to.have.been.calledOnce;
        }
    });
    it('changes InputComponent type to password according to props', () => {
        const textComponent = component
            .find(InputComponent)
            .filter(`[type="text"]`);
        const passwordComponent = component
            .find(InputComponent)
            .filter(`[type="password"]`);
        expect(textComponent.props().type).to.equal('text');
        expect(passwordComponent.props().type).to.equal('password');
    });
    it('assigns default value to InputComponent error prop', () => {
        for (let i = 0; i < inputs.length; i += 1) {
            const inputComponent = component.find(InputComponent).at(i);
            expect(inputComponent.props().errors).to.deep.equal([]);
        }
    });
    it('assigns prop value to InputComponent error prop', () => {
        const errorProps = [...defaultProps];
        const error = ['errors'];
        errorProps[0].errors = error;
        const errorComponent = renderComponent(errorProps);
        const inputComponent = errorComponent.find(InputComponent).at(0);
        expect(inputComponent.props().errors).to.deep.equal(error);
    });
});
