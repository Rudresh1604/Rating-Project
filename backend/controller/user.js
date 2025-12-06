const pool = require("../db/dbConnect");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET;

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required !" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const [users] = await pool.query(
      "insert into users(name,email,password,role) values(?,?,?,?)",
      [name, email, hashPassword, role]
    );
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, error: error, message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(req.body);

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required !" });
    }
    const [user] = await pool.query(
      "select * from users where email=? and role=?",
      [email, role]
    );
    console.log(user);

    if (user.length == 0) {
      return res
        .status(200)
        .json({ success: false, message: "User not found !" });
    }
    const passCheck = await bcrypt.compare(password, user[0]?.password);
    if (passCheck == false) {
      return res
        .status(200)
        .json({ success: false, message: "Invalid login credentials !" });
    }
    const token = jwt.sign(
      { userId: user[0].id, role: user[0].role },
      jwtSecret,
      {
        expiresIn: "1d",
      }
    );
    return res
      .status(200)
      .json({ success: true, message: "Login successfully !", token: token });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send({ success: false, error: error, message: error?.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    console.log("user id ", req.user);

    // Get user basic info
    const [userData] = await pool.query(
      `SELECT 
        id, name, email, address, role, created_at
       FROM users 
       WHERE id = ?`,
      [userId]
    );

    if (userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userData[0];

    // Get all ratings submitted by user with store details
    const [userRatings] = await pool.query(
      `SELECT 
        r.id as rating_id,
        r.rating,
        r.message,
        r.created_at as rating_date,
        s.id as store_id,
        s.name as store_name,
        s.address as store_address,
        owner.name as store_owner_name
       FROM ratings r
       JOIN stores s ON r.store_id = s.id
       JOIN users owner ON s.owner_id = owner.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // If user is a store owner, get their stores and average ratings
    let ownedStores = [];
    if (userRole === "OWNER" || userRole === "ADMIN") {
      const [stores] = await pool.query(
        `SELECT 
          s.id,
          s.name,
          s.address,
          s.created_at,
          COALESCE(AVG(r.rating), 0) as average_rating,
          COUNT(r.id) as total_ratings
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = ?
         GROUP BY s.id
         ORDER BY s.created_at DESC`,
        [userId]
      );

      ownedStores = stores.map((store) => ({
        ...store,
        average_rating: parseFloat(store.average_rating).toFixed(1),
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          role: user.role,
          joined_date: user.created_at,
        },
        statistics: {
          total_ratings_submitted: userRatings.length,
          average_given_rating:
            userRatings.length > 0
              ? (
                  userRatings.reduce((sum, r) => sum + r.rating, 0) /
                  userRatings.length
                ).toFixed(1)
              : 0,
        },
        submitted_ratings: userRatings,
        owned_stores: ownedStores,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user profile",
      error: error.message,
    });
  }
};

const getStoreOwnerDashboard = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Verify user is a store owner
    if (req.user.role !== "OWNER" && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Store owner privileges required.",
      });
    }

    // Get all stores owned by this user
    const [ownedStores] = await pool.query(
      `SELECT 
        s.id,
        s.name,
        s.address,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as total_ratings
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = ?
       GROUP BY s.id
       ORDER BY s.name`,
      [ownerId]
    );

    if (ownedStores.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No stores found for this owner",
        data: {
          stores: [],
          total_feedback: 0,
        },
      });
    }

    // Get all ratings for all owned stores
    const storeIds = ownedStores.map((store) => store.id);

    const [allRatings] = await pool.query(
      `SELECT 
        r.id as rating_id,
        r.rating,
        r.message,
        r.created_at,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        s.id as store_id,
        s.name as store_name
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       JOIN stores s ON r.store_id = s.id
       WHERE s.owner_id = ?
       ORDER BY r.created_at DESC`,
      [ownerId]
    );

    // Group ratings by store
    const ratingsByStore = {};
    allRatings.forEach((rating) => {
      if (!ratingsByStore[rating.store_id]) {
        ratingsByStore[rating.store_id] = [];
      }
      ratingsByStore[rating.store_id].push({
        id: rating.rating_id,
        rating: rating.rating,
        message: rating.message,
        submitted_at: rating.created_at,
        user: {
          id: rating.user_id,
          name: rating.user_name,
          email: rating.user_email,
          role: rating.user_role,
        },
      });
    });

    // Format response
    const storesWithRatings = ownedStores.map((store) => ({
      id: store.id,
      name: store.name,
      address: store.address,
      average_rating: parseFloat(store.average_rating).toFixed(1),
      total_ratings: store.total_ratings,
      ratings: ratingsByStore[store.id] || [],
    }));

    // Calculate overall statistics
    const totalFeedback = allRatings.length;
    const overallAverage =
      ownedStores.reduce(
        (sum, store) => sum + parseFloat(store.average_rating),
        0
      ) / ownedStores.length;

    return res.status(200).json({
      success: true,
      data: {
        owner: {
          id: ownerId,
          name: req.user.name,
          email: req.user.email,
        },
        statistics: {
          total_stores: ownedStores.length,
          total_feedback_received: totalFeedback,
          overall_average_rating: parseFloat(overallAverage).toFixed(1),
        },
        stores: storesWithRatings,
        recent_feedback: allRatings.slice(0, 10), // Last 10 ratings
      },
    });
  } catch (error) {
    console.error("Error fetching store owner dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching dashboard data",
      error: error.message,
    });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    // Get all statistics in parallel
    const [
      [userStats],
      [storeStats],
      [ratingStats],
      [recentUsers],
      [recentStores],
      [recentRatings],
    ] = await Promise.all([
      pool.query(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN role = 'ADMIN' THEN 1 ELSE 0 END) as admin_count,
          SUM(CASE WHEN role = 'OWNER' THEN 1 ELSE 0 END) as owner_count,
          SUM(CASE WHEN role = 'USER' THEN 1 ELSE 0 END) as user_count,
          DATE(created_at) as date,
          COUNT(*) as daily_registrations
        FROM users
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `),

      pool.query(`
        SELECT 
          COUNT(*) as total_stores,
          COUNT(DISTINCT owner_id) as unique_owners,
          DATE(created_at) as date,
          COUNT(*) as daily_stores
        FROM stores
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `),

      pool.query(`
        SELECT 
          COUNT(*) as total_ratings,
          AVG(rating) as average_rating,
          DATE(created_at) as date,
          COUNT(*) as daily_ratings
        FROM ratings
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 7
      `),

      pool.query(`
        SELECT id, name, email, role, created_at 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 10
      `),

      pool.query(`
        SELECT s.id, s.name, s.address, u.name as owner_name, s.created_at,
               COALESCE(AVG(r.rating), 0) as avg_rating
        FROM stores s
        JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        GROUP BY s.id
        ORDER BY s.created_at DESC 
        LIMIT 10
      `),

      pool.query(`
        SELECT r.id, r.rating, r.message, r.created_at,
               u.name as user_name, s.name as store_name
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        JOIN stores s ON r.store_id = s.id
        ORDER BY r.created_at DESC 
        LIMIT 10
      `),
    ]);

    // Get top rated stores
    const [topRatedStores] = await pool.query(`
      SELECT s.id, s.name, s.address, u.name as owner_name,
             AVG(r.rating) as average_rating,
             COUNT(r.id) as total_ratings
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      LEFT JOIN ratings r ON s.id = r.store_id
      GROUP BY s.id
      HAVING COUNT(r.id) >= 1
      ORDER BY average_rating DESC 
      LIMIT 5
    `);

    // Get most active users (most ratings submitted)
    const [mostActiveUsers] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role,
             COUNT(r.id) as ratings_count,
             AVG(r.rating) as avg_rating_given
      FROM users u
      LEFT JOIN ratings r ON u.id = r.user_id
      GROUP BY u.id
      HAVING COUNT(r.id) > 0
      ORDER BY ratings_count DESC 
      LIMIT 5
    `);

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_users: userStats[0]?.total_users || 0,
          total_stores: storeStats[0]?.total_stores || 0,
          total_ratings: ratingStats[0]?.total_ratings || 0,
          average_system_rating: parseFloat(
            ratingStats[0]?.average_rating || 0
          ).toFixed(1),
          user_distribution: {
            admins: userStats[0]?.admin_count || 0,
            owners: userStats[0]?.owner_count || 0,
            users: userStats[0]?.user_count || 0,
          },
        },
        charts: {
          user_registrations: userStats,
          store_creations: storeStats,
          rating_submissions: ratingStats,
        },
        top_performers: {
          top_rated_stores: topRatedStores.map((store) => ({
            ...store,
            average_rating: parseFloat(store.average_rating || 0).toFixed(1),
          })),
          most_active_users: mostActiveUsers.map((user) => ({
            ...user,
            avg_rating_given: parseFloat(user.avg_rating_given || 0).toFixed(1),
          })),
        },
        recent_activity: {
          users: recentUsers,
          stores: recentStores.map((store) => ({
            ...store,
            avg_rating: parseFloat(store.avg_rating || 0).toFixed(1),
          })),
          ratings: recentRatings,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching admin dashboard",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getAdminDashboard,
  loginUser,
  registerUser,
  getStoreOwnerDashboard,
  getUserProfile,
};
