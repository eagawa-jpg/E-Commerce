-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  product_id INT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  customer_name VARCHAR(150) NULL,
  customer_email VARCHAR(150) NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- Table: order_items (optional support for batch orders)
CREATE TABLE IF NOT EXISTS order_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  quantity INT NOT NULL DEFAULT 1,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);
