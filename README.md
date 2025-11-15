# ✨ Para Amanda ✨

Un espacio web personal creado con amor, donde Amanda puede acceder a frases especiales, guardar recuerdos y gestionar recordatorios importantes.

## 🚀 Características

- **Frases de Barney**: Visualiza frases especiales organizadas por número
- **Recuerdos de Amanda**: CRUD completo para guardar y gestionar recuerdos especiales
- **Recordatorios**: Sistema de recordatorios con estados completados/pendientes

## 🛠️ Tecnologías

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con variables CSS y animaciones
- **JavaScript ES6+**: Vanilla JavaScript sin frameworks
- **Supabase**: Backend como servicio para persistencia de datos

## 📁 Estructura del Proyecto

```
amanda-project/
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos completos
├── js/
│   ├── config.js       # Configuración de Supabase
│   ├── supabase-client.js  # Cliente singleton para DB
│   ├── barney-phrases.js   # Manager de frases
│   ├── memories.js     # Manager de recuerdos (CRUD)
│   └── reminders.js    # Manager de recordatorios (CRUD)
└── README.md
```

## 🎨 Paleta de Colores

- **Fondo oscuro**: `#1a1a2e`, `#16213e`, `#0f3460`
- **Rojo primario**: `#e94560`
- **Morado primario**: `#a64ac9`
- **Azul primario**: `#6366f1`

## 🗄️ Base de Datos (Supabase)

El proyecto se conecta a las siguientes tablas:

1. **barney_phrases**: `id`, `phrase_number`, `phrase_title`, `phrase_text`, `response_text`, `created_at`
2. **amanda_memories**: `id`, `title`, `content`, `date`, `created_at`, `updated_at`
3. **reminders**: `id`, `content`, `is_completed`, `created_at`, `updated_at`

## 🚦 Cómo Usar

1. Abre `index.html` en un navegador moderno
2. Asegúrate de tener conexión a internet (para cargar Supabase CDN)
3. Haz click en cualquiera de las tres cards principales para acceder a cada sección

### Opciones de Desarrollo

- **Live Server**: Usa la extensión Live Server de VS Code para desarrollo local
- **Servidor local**: Cualquier servidor HTTP simple (Python, Node.js, etc.)

## ✨ Funcionalidades

### Frases de Barney
- Visualización en grid responsive
- Vista detallada de cada frase
- Navegación fluida entre lista y detalle

### Recuerdos de Amanda
- ✅ Crear nuevos recuerdos
- ✅ Editar recuerdos existentes
- ✅ Ver detalles completos
- ✅ Eliminar recuerdos (con confirmación)
- Formato de fechas en español (es-MX)

### Recordatorios
- ✅ Agregar recordatorios rápidamente
- ✅ Marcar como completados/pendientes
- ✅ Editar contenido
- ✅ Eliminar recordatorios (con confirmación)
- Estadísticas de pendientes/completados
- Separación visual por estado

## 🔒 Seguridad

- Escape de HTML para prevenir XSS
- Validación de formularios
- Manejo de errores robusto
- Confirmaciones antes de acciones destructivas

## 📱 Responsive Design

El proyecto está completamente optimizado para:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🎯 Mejores Prácticas Implementadas

- ✅ Separación de concerns (UI vs lógica)
- ✅ Patrón singleton para cliente DB
- ✅ Manejo de estados (loading, error, success)
- ✅ Notificaciones de éxito temporales
- ✅ Animaciones suaves
- ✅ Accesibilidad básica (aria-labels, semántica HTML)

## 🐛 Debugging

- Todos los errores se registran en `console.error`
- Mensajes de error amigables para el usuario
- Estados de carga visibles
- Botones de reintento en caso de error

## 📝 Notas

- El proyecto usa Supabase CDN, requiere conexión a internet
- Las fechas se formatean automáticamente a español (México)
- Los modals se pueden cerrar con ESC o click fuera
- Todas las operaciones son asíncronas con feedback visual

---

Hecho con ❤️ para Amanda

