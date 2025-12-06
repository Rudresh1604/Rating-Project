import axios from "axios";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { userContext } from "../App";

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const accessToken = localStorage.getItem("token");
  const { user, setUser } = useContext(userContext);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const getUserDetails = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/users/profile`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.data?.success) {
        setUserData(res.data?.data);
        setUser;
      }
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getUserDetails();
  }, []);
  return (
    <div className="flex items-center mx-5 py-3 my-3 px-5">
      <div className="w-full my-3">
        <div className=" border rounded-lg w-full bg-white border-gray-300 px-5 py-3 text-xl font-medium flex flex-col gap-4">
          <h1 className=" text-3xl max-sm:text-xl text-green-500">
            Welcome {userData?.user?.name}{" "}
          </h1>
          <h2>My Email {userData?.user?.email} </h2>
        </div>
        <div className="flex flex-col my-4 gap-2">
          <h1 className="text-2xl border-b-2 border-b-cyan-600  max-sm:text-xl font-medium">
            My Submitted Ratings :{" "}
          </h1>

          <div></div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
