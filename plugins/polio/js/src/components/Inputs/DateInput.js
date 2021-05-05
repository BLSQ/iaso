import { TextInput } from './TextInput';
import { useInputStyles } from './Styles';

export const DateInput = ({ field, form, ...props }) => {
    const classes = useInputStyles();

    return (
        <TextInput
            className={classes.input}
            id="date"
            type="date"
            field={field}
            form={form}
            {...props}
        />
    );
};
