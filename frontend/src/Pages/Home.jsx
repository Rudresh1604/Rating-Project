import axios from "axios";
import React, { useEffect, useState } from "react";
import StoreCard from "../components/StoreCard";
import { useContext } from "react";
import { userContext } from "../App";

const Home = () => {
  const [allStores, setAllStores] = useState([
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
    {
      id: 1,
      name: "Big Store",
      email: "store@email.com",
      address: "Main street",
      avgRating: 4.5,
      userRating: 3,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const accessToken = localStorage.getItem("token");
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const { user, setUser } = useContext(userContext);
  console.log("user is ", user);

  const getAllStoreDetails = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/stores/all`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.data?.success) {
        // setAllStores(res.data?.data);
      }
      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    getAllStoreDetails();
  }, []);

  return (
    <div className="max-w-screen flex flex-col gap-3">
      <div>
        <h1>Welcome to Rating Website </h1>
      </div>
      <div className="p-4 grid gap-4 grid-cols-3">
        {allStores.map((store, index) => (
          <StoreCard key={index} token={accessToken} store={store} />
        ))}
      </div>
    </div>
  );
};

export default Home;
