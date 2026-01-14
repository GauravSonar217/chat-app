import React, { useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import CustomFormInput from "../component/CustomFormInput";
import { Link } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle login logic here
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setUserData({
      ...userData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: "",
    });
  };

  return (
    <section className="register-page">
      <div className="register-card">
        <h2 className="text-center mb-4">Register</h2>
        <Form onSubmit={handleSubmit} className="w-100">
          <div className="mb-4">
            <div class="row justify-content-center align-items-center row-gap-1">
              <div class="col-12">
                <CustomFormInput
                  type="text"
                  label="User Name"
                  name="userName"
                  placeholder="Enter user name"
                  value={userData.userName}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="First Name"
                  name="firstName"
                  placeholder="Enter first name"
                  value={userData.firstName}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Last Name"
                  name="lastName"
                  placeholder="Enter last name"
                  value={userData.lastName}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="email"
                  label="Email"
                  name="email"
                  placeholder="Enter email"
                  value={userData.email}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Phone Number"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  value={userData.phoneNumber}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Password"
                  name="password"
                  placeholder="Enter password"
                  value={userData.password}
                  onChange={handleFormChange}
                />
              </div>
              <div class="col-6">
                <CustomFormInput
                  type="text"
                  label="Confirm Password"
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={userData.confirmPassword}
                  onChange={handleFormChange}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="w-100  btn-primary">
            Sign up
          </button>
          <div className="mt-3 text-center">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        </Form>
      </div>
    </section>
  );
};

export default Register;
