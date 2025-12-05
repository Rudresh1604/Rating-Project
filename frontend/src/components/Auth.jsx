import React, { useEffect, useState } from "react";
import { KeyRound, Mail, User, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const AuthForm = ({ isLoginForm = true }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (
        !isLoginForm &&
        (formData.name.length < 8 || formData.name?.length > 40)
      ) {
        toast("Name must be between 10 to 40 characters");
        return;
      }
      console.log("true ");

      const res = await axios.post(
        `${backendUrl}/api/users/${isLoginForm ? "login" : "register"}`,
        formData
      );
      toast.success(res.data?.message || "Success");

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  return (
    <div className="flex flex-col w-auto items-center border py-2 px-6 rounded-lg border-gray-300 shadow-xl justify-center">
      {isLoginForm ? (
        <h1 className="mb-2 text-xl block font-medium text-gray-700">
          Login Form
        </h1>
      ) : (
        <h1 className="mb-2 block text-xl font-medium text-gray-700">
          Register Form
        </h1>
      )}
      <form
        className="flex max-w flex-col gap-4 text-lg "
        onSubmit={handleSubmit}
      >
        {!isLoginForm && (
          <div>
            <label
              htmlFor="name"
              className="mb-2 block font-medium text-gray-700"
            >
              Name :
            </label>
            <div className="flex rounded-lg border border-gray-300  focus-within:ring-blue-500 focus-within:border-blue-500">
              <User className="w-8 h-8 my-auto text-gray-500 ml-2" />
              <input
                id="name"
                type="text"
                value={formData?.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full  focus:outline-none p-2.5"
                required
              />
            </div>
          </div>
        )}
        <div>
          <label
            htmlFor="email"
            className="mb-2 block font-medium text-gray-700"
          >
            Email
          </label>
          <div className="flex rounded-lg border border-gray-300  focus-within:ring-blue-500 focus-within:border-blue-500">
            <Mail className="w-8 h-8 my-auto text-gray-500 ml-2" />
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              className="w-full  focus:outline-none focus:ring-0 p-2.5"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="password1"
            className="mb-2 block  font-medium text-gray-700"
          >
            Password
          </label>
          <div className="flex rounded-lg border border-gray-300  focus-within:ring-blue-500 focus-within:border-blue-500">
            <KeyRound className="w-8 h-8 my-auto text-gray-500 ml-2" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="w-full p-2.5   focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="mr-3 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="role"
            className="mb-2 block  font-medium text-gray-700"
          >
            Select your role
          </label>
          <div className="flex rounded-lg border border-gray-300  focus-within:ring-blue-500 focus-within:border-blue-500">
            <User className="w-8 h-8 my-auto text-gray-500 ml-2 " />
            <select
              id="role"
              value={formData.role}
              className="w-full  p-2.5   focus:outline-none  cursor-pointer"
              required
              onChange={handleChange}
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
              <option value="OWNER">Store Owner</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-center text-white
               hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 cursor-pointer"
        >
          {isLoginForm
            ? loading
              ? "Logging in..."
              : "Login"
            : loading
            ? "Registering..."
            : "Register"}
        </button>
      </form>
    </div>
  );
};

export default AuthForm;
