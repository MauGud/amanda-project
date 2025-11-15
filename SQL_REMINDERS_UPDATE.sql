-- ============================================
-- ACTUALIZACIÓN DE TABLA REMINDERS
-- ============================================

-- 1. Agregar columna is_important (muy importante)
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false;

-- 2. Agregar columna important_at (timestamp para ordenar por último marcado)
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS important_at TIMESTAMP WITH TIME ZONE;

-- 3. Agregar columna is_example (para identificar el ejemplo que no se puede borrar)
ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS is_example BOOLEAN DEFAULT false;

-- 4. Insertar el recordatorio de ejemplo (si no existe)
INSERT INTO reminders (content, is_completed, is_important, is_example, created_at)
SELECT 
  'Si eres las cosas bonitas que los otros ven de ti',
  false,
  false,
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM reminders WHERE is_example = true
);

-- 5. Crear índice para mejorar performance en ordenamiento
CREATE INDEX IF NOT EXISTS idx_reminders_important_order 
ON reminders (is_important DESC, important_at DESC NULLS LAST, created_at DESC);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que todo esté correcto:
-- SELECT id, content, is_important, important_at, is_example, is_completed, created_at 
-- FROM reminders 
-- ORDER BY is_important DESC, important_at DESC NULLS LAST, created_at DESC;


