-- MiniRDBMS Demo Queries
-- Copy and paste these into the SQL Console to try out the features

-- 1. Create a users table
CREATE TABLE users (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  active BOOLEAN
);

-- 2. Insert some users
INSERT INTO users VALUES (1, 'Alice Johnson', 'alice@example.com', true);
INSERT INTO users VALUES (2, 'Bob Smith', 'bob@example.com', true);
INSERT INTO users VALUES (3, 'Carol White', 'carol@example.com', false);

-- 3. Query all users
SELECT * FROM users;

-- 4. Query specific user
SELECT * FROM users WHERE id = 1;

-- 5. Query by email (uses index!)
SELECT name, email FROM users WHERE email = 'bob@example.com';

-- 6. Create an orders table
CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT NOT NULL,
  amount FLOAT NOT NULL,
  status TEXT
);

-- 7. Insert some orders
INSERT INTO orders VALUES (1, 1, 99.99, 'completed');
INSERT INTO orders VALUES (2, 1, 149.50, 'pending');
INSERT INTO orders VALUES (3, 2, 75.00, 'completed');
INSERT INTO orders VALUES (4, 3, 200.00, 'cancelled');

-- 8. Query all orders
SELECT * FROM orders;

-- 9. JOIN users and orders
SELECT users.name, orders.amount, orders.status
FROM users
JOIN orders ON users.id = orders.user_id;

-- 10. Update a user
UPDATE users SET active = false WHERE id = 2;

-- 11. Update an order status
UPDATE orders SET status = 'shipped' WHERE id = 2;

-- 12. Delete an order
DELETE FROM orders WHERE id = 4;

-- 13. Query updated data
SELECT * FROM users;
SELECT * FROM orders;

-- 14. Create a products table to demonstrate more features
CREATE TABLE products (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  price FLOAT NOT NULL,
  in_stock BOOLEAN
);

-- 15. Insert products
INSERT INTO products VALUES (1, 'Laptop', 999.99, true);
INSERT INTO products VALUES (2, 'Mouse', 29.99, true);
INSERT INTO products VALUES (3, 'Keyboard', 79.99, false);
INSERT INTO products VALUES (4, 'Monitor', 299.99, true);

-- 16. Query products
SELECT * FROM products WHERE in_stock = true;

-- Tips:
-- - Watch the Query Execution Log to see performance metrics
-- - Notice when indexes are used (email and id lookups)
-- - Use the Table Explorer to view schema and indexes
-- - Try the CRUD Panel for visual data management
