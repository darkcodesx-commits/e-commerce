CREATE TABLE animals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    breed VARCHAR(100),
    age INT,
    description TEXT,
    price DECIMAL(10, 2),
    image_url VARCHAR(255),
    added_by VARCHAR(100)
);

CREATE TABLE animal_bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_email VARCHAR(100),
    animal_id INT,
    booking_date DATE,
    message TEXT,
    FOREIGN KEY (animal_id) REFERENCES animals(id)
);

CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    address TEXT
);
