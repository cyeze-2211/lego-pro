import PropTypes from 'prop-types';
import { formatNumber, parseNumber } from './number-format';
import FormControl from './FormControl';

export default function FormattedNumberInput({ value, onChange, ...props }) {
    return (
        <FormControl
            {...props}
            value={formatNumber(value)}
            onChange={(event) => onChange(parseNumber(event.target.value))}
            inputMode="decimal"
        />
    );
}

FormattedNumberInput.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
};

FormattedNumberInput.defaultProps = {
    value: '',
};
