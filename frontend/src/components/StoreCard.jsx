import React, { useState, useContext } from "react";
import { StarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { userContext } from "../App";
import { toast } from "react-toastify";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const StoreCard = ({ store, token, user }) => {
  const navigate = useNavigate();

  const [rating, setRating] = useState(store?.userRating || 0);
  const [loading, setLoading] = useState(false);
  console.log(user);

  const handleRate = async (value) => {
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      setRating(value);
      setLoading(true);

      await axios.post(
        `${backendUrl}/api/ratings`,
        {
          storeId: store.id,
          rating: value,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast("Rating submitted!");
    } catch (err) {
      console.error(err);
      toast("Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg px-4 py-3 shadow-md space-y-2">
      <div>
        <h1 className="font-semibold text-lg">{store.name}</h1>
        <p className="text-gray-600">{store.email}</p>
        <p className="text-gray-600">{store.address}</p>
        <p className="text-yellow-600 font-medium">
          ⭐ Avg Rating: {store.avgRating || 0}/5
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Your Rating:</span>

        <div className="flex items-center gap-1 cursor-pointer">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              size={24}
              className={`transition
                ${
                  rating >= star
                    ? "fill-yellow-400 stroke-yellow-400"
                    : "stroke-gray-400"
                }
                ${loading && "pointer-events-none opacity-50"}
              `}
              onClick={() => handleRate(star)}
            />
          ))}
        </div>
      </div>

      {!token && (
        <p className="text-sm text-red-500">Login required to submit rating</p>
      )}
    </div>
  );
};

export default StoreCard;
