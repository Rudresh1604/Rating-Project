import React from "react";
import AuthForm from "../components/SignIn";

const Register = () => {
  return (
    <div className="flex items-center justify-center w-full h-screen ">
      <AuthForm isLoginForm={false} />
    </div>
  );
};

export default Register;
