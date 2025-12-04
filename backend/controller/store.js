const pool = require("../db/dbConnect");

const addStore = async (req, res) => {
  try {
    const { admin, name, owner_id, address } = req.body;
    const [row] = pool.query(
      "insert into stores(owner_id,name,address,created_by) values ()",
      [owner_id, name, address, admin?.id]
    );
    return res.status(200).json({ success: true, data: row });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: error.message,
    });
  }
};

// const updateStore = async (req, res) => {
//   try {
//     const { admin, name, owner_id, address } = req.body;
//     const [row] = pool.query(
//       "insert into stores(owner_id,name,address,created_by) values ()",
//       [owner_id, name, address, admin?.id]
//     );
//     return res.status(200).json({ success: true, data: row });
//   } catch (error) {
//     console.log(error);

//     return res.status(500).json(error);
//   }
// };

const getStoreFeedback = async (req, res) => {
  try {
    const { storeId } = req.params;

    const [storeCheck] = await pool.query(
      "SELECT id, name FROM stores WHERE id = ?",
      [storeId]
    );

    if (storeCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        r.id,
        r.rating,
        r.message,
        r.created_at as review_date,
        u.id as user_id,
        u.name as user_name,
        u.role as user_role
       FROM ratings r
       INNER JOIN users u ON r.user_id = u.id
       WHERE r.store_id = ?
       ORDER BY r.created_at DESC`,
      [storeId]
    );

    let totalRating = 0;
    let ratingCount = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    rows.forEach((review) => {
      totalRating += review.rating;
      ratingCount[review.rating]++;
    });

    const averageRating =
      rows.length > 0 ? (totalRating / rows.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      store: {
        id: storeId,
        name: storeCheck[0].name,
        total_reviews: rows.length,
        average_rating: parseFloat(averageRating),
        rating_distribution: ratingCount,
      },
      reviews: rows.map((review) => ({
        id: review.id,
        rating: review.rating,
        message: review.message,
        review_date: review.review_date,
        user: {
          id: review.user_id,
          name: review.user_name,
          role: review.user_role,
        },
      })),
    });
  } catch (error) {
    console.error("Error fetching store feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching feedback",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getAllStore = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.address,
        u.email as owner_email,
        u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      INNER JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      GROUP BY s.id, s.name, s.address, u.email, u.name
      ORDER BY average_rating DESC
    `);

    return res.status(200).json({
      success: true,
      data: rows.map((store) => ({
        ...store,
        average_rating: parseFloat(store.average_rating).toFixed(1),
      })),
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching stores",
    });
  }
};

const searchStore = async (req, res) => {
  try {
    const { name, address } = req.query;

    let whereClause = "WHERE 1=1";
    const params = [];

    if (name) {
      whereClause += " AND s.name LIKE ?";
      params.push(`%${name}%`);
    }

    if (address) {
      whereClause += " AND s.address LIKE ?";
      params.push(`%${address}%`);
    }

    const query = `
      SELECT 
        s.id,
        s.name,
        s.address,
        u.email as owner_email,
        u.name as owner_name,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
      FROM stores s
      INNER JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      ${whereClause}
      GROUP BY s.id, s.name, s.address, u.email, u.name
      ORDER BY average_rating DESC
    `;

    const [rows] = await pool.query(query, params);

    const userId = req.user?.id;
    let storesData = rows;

    if (userId) {
      const storeIds = rows.map((store) => store.id);
      if (storeIds.length > 0) {
        const [userRatings] = await pool.query(
          "SELECT store_id, rating, message FROM ratings WHERE user_id = ? AND store_id IN (?)",
          [userId, storeIds]
        );

        // Map user's ratings to stores
        const userRatingsMap = {};
        userRatings.forEach((rating) => {
          userRatingsMap[rating.store_id] = {
            rating: rating.rating,
            message: rating.message,
          };
        });

        storesData = rows.map((store) => ({
          ...store,
          average_rating: parseFloat(store.average_rating).toFixed(1),
          user_rating: userRatingsMap[store.id] || null,
        }));
      }
    } else {
      storesData = rows.map((store) => ({
        ...store,
        average_rating: parseFloat(store.average_rating).toFixed(1),
        user_rating: null,
      }));
    }

    return res.status(200).json({
      success: true,
      count: storesData.length,
      filters: { name, address },
      data: storesData,
    });
  } catch (error) {
    console.error("Error searching stores:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching stores",
    });
  }
};

module.exports = { addStore, getAllStore, getStoreFeedback, searchStore };
