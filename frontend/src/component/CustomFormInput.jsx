import React from "react";
import { Form } from "react-bootstrap";

const CustomFormInput = ({
  label,
  type,
  placeholder,
  className,
  error,
  ...rest
}) => {
  return (
    <Form.Group className="theme-input">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type={type}
        placeholder={placeholder}
        className={className}
        isInvalid={!!error}
        {...rest}
      />
      {error && (
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      )}
    </Form.Group>
  );
};

export default CustomFormInput;
