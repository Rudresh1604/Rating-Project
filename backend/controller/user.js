const pool = require("../db/dbConnect");

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "Select id,name,email,address,role from users"
    );
    console.log(users);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { getUsers };
