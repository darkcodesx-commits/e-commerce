CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_email VARCHAR(100),
    farm_name VARCHAR(100),
    date DATE,
    message TEXT
);
