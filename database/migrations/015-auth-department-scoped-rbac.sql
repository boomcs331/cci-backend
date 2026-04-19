-- Department-scoped RBAC for Postgres
-- - user has primary department
-- - role can be GLOBAL or DEPARTMENT scoped
-- - role assignment can be scoped by department

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_scope_type_enum') THEN
    CREATE TYPE role_scope_type_enum AS ENUM ('GLOBAL', 'DEPARTMENT');
  END IF;
END $$;

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS scope_type role_scope_type_enum NOT NULL DEFAULT 'GLOBAL';

CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS department_id BIGINT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_users_department_id'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_department_id
      FOREIGN KEY (department_id)
      REFERENCES departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

CREATE TABLE IF NOT EXISTS user_role_assignments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  department_id BIGINT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_role_assignments_user_id'
  ) THEN
    ALTER TABLE user_role_assignments
      ADD CONSTRAINT fk_user_role_assignments_user_id
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_role_assignments_role_id'
  ) THEN
    ALTER TABLE user_role_assignments
      ADD CONSTRAINT fk_user_role_assignments_role_id
      FOREIGN KEY (role_id)
      REFERENCES roles(id)
      ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_role_assignments_department_id'
  ) THEN
    ALTER TABLE user_role_assignments
      ADD CONSTRAINT fk_user_role_assignments_department_id
      FOREIGN KEY (department_id)
      REFERENCES departments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_department_id ON user_role_assignments(department_id);

-- department_id can be NULL for GLOBAL roles, so use COALESCE for uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_role_assignment_scope
  ON user_role_assignments(user_id, role_id, COALESCE(department_id, 0));
