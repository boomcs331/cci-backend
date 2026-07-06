-- ลำดับกระบวนการผลิตต่อ Product (หลังกำหนด BOM)
CREATE TABLE IF NOT EXISTS product_production_steps (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  process_id INTEGER NOT NULL REFERENCES production_processes (id) ON DELETE RESTRICT,
  create_date TIMESTAMP NOT NULL DEFAULT now(),
  create_by VARCHAR(255),
  update_date TIMESTAMP NOT NULL DEFAULT now(),
  update_by VARCHAR(255),
  CONSTRAINT uq_product_production_steps_product_step UNIQUE (product_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_product_production_steps_product_id ON product_production_steps (product_id);
