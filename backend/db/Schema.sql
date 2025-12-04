CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(60) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  address VARCHAR(400),
  role ENUM('ADMIN','USER','OWNER') DEFAULT 'USER',
  created_by INT NULL,  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_user_created_by
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE SET NULL
);

CREATE TABLE stores(
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(400) NOT NULL,
  created_by INT NOT NULL,  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_store_owner
  FOREIGN KEY(owner_id)
  REFERENCES users(id)
  ON DELETE CASCADE,
  
  CONSTRAINT fk_store_created_by
  FOREIGN KEY(created_by)
  REFERENCES users(id)
  ON DELETE RESTRICT
);


CREATE TABLE ratings(
  id INT AUTO_INCREMENT PRIMARY KEY,
  rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5),
  store_id INT NOT NULL,
  user_id INT NOT NULL,
  message VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_rating_store
  FOREIGN KEY (store_id)
  REFERENCES stores(id)
  ON DELETE CASCADE,
  
  CONSTRAINT fk_rating_user
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE,
  
  CONSTRAINT unique_user_store_rating
  UNIQUE(user_id, store_id)
);