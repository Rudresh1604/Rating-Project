import React, { useContext, useEffect } from "react";
import { userContext } from "../App";

const Dashboard = () => {
  const { user, setUser } = useContext(userContext);
  console.log(user);
  useEffect(() => {}, [user]);
  return (
    <div>
      <h1>User Dashboard Page </h1>
    </div>
  );
};

export default Dashboard;
