const pool = require("../db/dbConnect");

const addRating = async (req, res) => {
  try {
    const { store_id, rating, message, user_id } = req.body;

    if (!store_id || !rating) {
      return res.status(400).json({
        success: false,
        message: "Store ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const [userCheck] = await pool.query(
      "SELECT id, name FROM users WHERE id = ?",
      [user_id]
    );
    if (userCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const [storeCheck] = await pool.query(
      "SELECT id, name FROM stores WHERE id = ?",
      [store_id]
    );
    if (storeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const [existingRating] = await pool.query(
      "SELECT id FROM ratings WHERE store_id = ? AND user_id = ?",
      [store_id, user_id]
    );

    if (existingRating.length !== 0) {
      return res.status(409).json({
        success: false,
        message: "You have already rated this store. Use update instead.",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO ratings (user_id, rating, store_id, message) 
       VALUES (?, ?, ?, ?)`,
      [user_id, rating, store_id, message || null]
    );

    const [newRating] = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.message,
        r.created_at,
        u.name as user_name,
        s.name as store_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN stores s ON r.store_id = s.id
       WHERE r.id = ?`,
      [result.insertId]
    );

    const [avgResult] = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
       FROM ratings 
       WHERE store_id = ?`,
      [store_id]
    );

    return res.status(201).json({
      success: true,
      message: "Rating submitted successfully",
      data: {
        rating: newRating[0],
        store_stats: {
          store_id,
          average_rating: parseFloat(avgResult[0].average_rating).toFixed(1),
          total_ratings: avgResult[0].total_ratings,
        },
      },
    });
  } catch (error) {
    console.error("Error adding rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const updateRating = async (req, res) => {
  try {
    const { rating, message, rating_id, user_id } = req.body;

    if (!rating_id) {
      return res.status(400).json({
        success: false,
        message: "Rating ID is required",
      });
    }

    const [ratingCheck] = await pool.query(
      `SELECT r.*, s.name as store_name 
       FROM ratings r
       JOIN stores s ON r.store_id = s.id
       WHERE r.id = ? AND r.user_id = ?`,
      [rating_id, user_id]
    );

    if (ratingCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Rating not found or you don't have permission to update it",
      });
    }

    const [result] = await pool.query(
      `UPDATE ratings 
       SET rating = ?, message = ?
       WHERE id = ? AND user_id = ?`,
      [rating, message || null, rating_id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update rating",
      });
    }

    const [updatedRating] = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.message,
        r.created_at,
        r.updated_at,
        u.name as user_name,
        s.name as store_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN stores s ON r.store_id = s.id
       WHERE r.id = ?`,
      [rating_id]
    );

    const [avgResult] = await pool.query(
      `SELECT 
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(*) as total_ratings
       FROM ratings 
       WHERE store_id = ?`,
      [ratingCheck[0].store_id]
    );

    return res.status(200).json({
      success: true,
      message: "Rating updated successfully",
      data: {
        rating: updatedRating[0],
        store_stats: {
          store_id: ratingCheck[0].store_id,
          store_name: ratingCheck[0].store_name,
          average_rating: parseFloat(avgResult[0].average_rating).toFixed(1),
          total_ratings: avgResult[0].total_ratings,
        },
      },
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating rating",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getMyRatings = async (req, res) => {
  try {
    const { user_id } = req.body;

    const [ratings] = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.message,
        r.created_at,
        s.id as store_id,
        s.name as store_name,
        s.address as store_address,
        u_owner.name as store_owner_name
       FROM ratings r
       JOIN stores s ON r.store_id = s.id
       JOIN users u_owner ON s.owner_id = u_owner.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [user_id]
    );

    return res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings,
    });
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching ratings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  addRating,
  updateRating,
  getMyRatings,
};
