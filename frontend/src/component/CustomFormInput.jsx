import React from "react";

const CustomFormInput = ({
  label,
  type,
  placeholder,
  parentClass,
  className,
  error,
  ...rest
}) => {
  return (
    <div className={`theme-input ${parentClass}`}>
      <input
        className={`form-control ${className}`}
        type={type}
        placeholder={placeholder}
        isInvalid={!!error}
        {...rest}
      />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
};

export default CustomFormInput;
