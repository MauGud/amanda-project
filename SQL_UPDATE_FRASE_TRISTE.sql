-- ============================================
-- ACTUALIZAR FRASE "Cuando estoy triste"
-- ============================================

-- Quitar "Verdadera historia" de la frase
UPDATE barney_phrases
SET phrase_text = REPLACE(phrase_text, 'Verdadera historia.', '')
WHERE phrase_title ILIKE '%cuando estoy triste%'
  AND phrase_text LIKE '%Verdadera historia%';

-- También quitar si tiene punto al final y espacio antes
UPDATE barney_phrases
SET phrase_text = TRIM(REPLACE(phrase_text, '. Verdadera historia.', '.'))
WHERE phrase_title ILIKE '%cuando estoy triste%'
  AND phrase_text LIKE '%. Verdadera historia.%';

-- Limpiar espacios extra al final
UPDATE barney_phrases
SET phrase_text = TRIM(phrase_text)
WHERE phrase_title ILIKE '%cuando estoy triste%';

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta esto para verificar:
-- SELECT id, phrase_title, phrase_text 
-- FROM barney_phrases 
-- WHERE phrase_title ILIKE '%cuando estoy triste%';


