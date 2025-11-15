-- ============================================
-- CONFIGURACIÓN DE TABLA AMANDA_MEMORIES
-- ============================================

-- 1. Crear tabla si no existe (estructura completa)
CREATE TABLE IF NOT EXISTS amanda_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  image_url TEXT,
  image_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Agregar columnas de imagen si la tabla ya existe pero no las tiene
ALTER TABLE amanda_memories
ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE amanda_memories
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- 3. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Crear trigger para actualizar updated_at en cada UPDATE
DROP TRIGGER IF EXISTS update_amanda_memories_updated_at ON amanda_memories;
CREATE TRIGGER update_amanda_memories_updated_at
  BEFORE UPDATE ON amanda_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_amanda_memories_date 
ON amanda_memories (date DESC);

CREATE INDEX IF NOT EXISTS idx_amanda_memories_created_at 
ON amanda_memories (created_at DESC);

-- 6. Índice en image_path para búsquedas rápidas
-- (NOTA: No se hace único porque el mismo archivo podría usarse en diferentes recuerdos)
CREATE INDEX IF NOT EXISTS idx_amanda_memories_image_path 
ON amanda_memories (image_path) 
WHERE image_path IS NOT NULL;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar que todo esté correcto:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'amanda_memories'
-- ORDER BY ordinal_position;

-- Ver estructura completa:
-- SELECT id, title, content, date, image_url, image_path, created_at, updated_at 
-- FROM amanda_memories 
-- ORDER BY date DESC 
-- LIMIT 5;

