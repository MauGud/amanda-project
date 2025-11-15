/**
 * Manager para los recuerdos de Amanda
 * Maneja CRUD completo de recuerdos
 */
class MemoriesManager {
  constructor() {
    this.modal = document.getElementById('memoriesModal');
    this.contentDiv = this.modal?.querySelector('.content-div');
    this.memories = [];
    this.currentView = 'grid'; // 'grid' | 'add' | 'edit' | 'detail'
    this.editingId = null;
    this.currentImageFile = null;
  }

  /**
   * Abre el modal y carga los recuerdos
   */
  async open() {
    if (!this.modal) return;
    
    this.modal.classList.add('active');
    document.body.classList.add('modal-open');
    this.currentView = 'grid';
    await this.loadMemories();
  }

  /**
   * Cierra el modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
    document.body.classList.remove('modal-open');
    this.currentView = 'grid';
    this.editingId = null;
  }

  /**
   * Carga los recuerdos desde Supabase
   */
  async loadMemories() {
    if (!this.contentDiv) return;

    // Mostrar loading
    this.contentDiv.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando recuerdos...</p>
      </div>
    `;

    try {
      const result = await window.db.getAllMemories();

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar recuerdos');
      }

      this.memories = result.data || [];
      this.displayMemoriesGrid();
    } catch (error) {
      console.error('Error al cargar recuerdos:', error);
      this.showError('No se pudieron cargar los recuerdos. Por favor, intenta de nuevo.', () => {
        this.loadMemories();
      });
    }
  }

  /**
   * Muestra el grid de recuerdos
   */
  displayMemoriesGrid() {
    if (!this.contentDiv) return;

    this.currentView = 'grid';

    const headerHTML = `
      <div class="section-header">
        <button class="share-btn" onclick="memoriesManager.showShareOptions()">
          🔗 Que un amigx suba un recuerdo contigo
        </button>
        <button class="add-btn" onclick="memoriesManager.showAddForm()">
          <span>+</span> Agregar Recuerdo
        </button>
      </div>
    `;

    if (this.memories.length === 0) {
      this.contentDiv.innerHTML = `
        ${headerHTML}
        <div class="empty-state">
          <div class="empty-icon">📸</div>
          <h3>No hay recuerdos aún</h3>
          <p>Comienza agregando tu primer recuerdo especial.</p>
          <button class="btn-add" onclick="memoriesManager.showAddForm()">
            Agregar Primer Recuerdo
          </button>
        </div>
      `;
      return;
    }

    const memoriesHTML = this.memories.map(memory => {
      const date = new Date(memory.date);
      const formattedDate = date.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const preview = this.escapeHtml(memory.content || '').substring(0, 100);
      const ellipsis = (memory.content || '').length > 100 ? '...' : '';

      return `
        <div class="memory-card">
          ${memory.image_url ? `<img src="${memory.image_url}" class="memory-card-image" alt="${this.escapeHtml(memory.title)}">` : ''}
          <div class="memory-date">${formattedDate}</div>
          <h3 class="memory-title">${this.escapeHtml(memory.title || 'Sin título')}</h3>
          <p class="memory-preview">${preview}${ellipsis}</p>
          <div class="memory-actions">
            <button class="btn-view" onclick="memoriesManager.showMemoryDetail('${memory.id}')">
              Ver
            </button>
            <button class="btn-edit" onclick="memoriesManager.showEditForm('${memory.id}')">
              Editar
            </button>
            <button class="btn-delete" onclick="memoriesManager.confirmDelete('${memory.id}')">
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.contentDiv.innerHTML = `
      ${headerHTML}
      <div class="memories-grid">
        ${memoriesHTML}
      </div>
    `;
  }

  /**
   * Muestra el formulario para agregar un recuerdo
   */
  showAddForm() {
    if (!this.contentDiv) return;

    this.currentView = 'add';
    this.editingId = null;

    const today = new Date().toISOString().split('T')[0];

    this.contentDiv.innerHTML = `
      <div class="form-container">
        <h2>Agregar Nuevo Recuerdo</h2>
        <form id="memoryForm" onsubmit="memoriesManager.handleSubmit(event)">
          <div class="form-group">
            <label for="memoryImage">Foto del recuerdo *</label>
            <input type="file" id="memoryImage" accept="image/*" required onchange="memoriesManager.handleImageSelect(event)">
            <div id="imagePreview" style="margin-top: 15px; display: none;">
              <img id="previewImg" style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 10px;">
            </div>
          </div>
          <div class="form-group">
            <label for="memoryTitle">Título *</label>
            <input 
              type="text" 
              id="memoryTitle" 
              name="title" 
              required 
              maxlength="100"
              placeholder="Ej: Nuestro primer día juntos"
            >
          </div>
          <div class="form-group">
            <label for="memoryDate">Fecha *</label>
            <input 
              type="date" 
              id="memoryDate" 
              name="date" 
              required
              value="${today}"
            >
          </div>
          <div class="form-group">
            <label for="memoryContent">Contenido *</label>
            <textarea 
              id="memoryContent" 
              name="content" 
              required 
              rows="8"
              placeholder="Describe este recuerdo especial..."
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="memoriesManager.displayMemoriesGrid()">
              Cancelar
            </button>
            <button type="submit" class="btn-save">
              Guardar Recuerdo
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Muestra el formulario para editar un recuerdo
   * @param {string|number} id - ID del recuerdo
   */
  async showEditForm(id) {
    if (!this.contentDiv) return;

    const memory = this.memories.find(m => m.id == id);
    if (!memory) {
      this.showError('Recuerdo no encontrado.');
      return;
    }

    this.currentView = 'edit';
    this.editingId = id;

    const dateValue = memory.date ? new Date(memory.date).toISOString().split('T')[0] : '';

    this.contentDiv.innerHTML = `
      <div class="form-container">
        <h2>Editar Recuerdo</h2>
        <form id="memoryForm" onsubmit="memoriesManager.handleUpdate(event, '${id}')">
          <div class="form-group">
            <label for="memoryImage">Cambiar foto (opcional)</label>
            <input type="file" id="memoryImage" accept="image/*" onchange="memoriesManager.handleImageSelect(event)">
            ${memory.image_url ? `<div style="margin-top: 15px;"><img src="${memory.image_url}" style="width: 100%; max-height: 200px; object-fit: contain; border-radius: 10px;"></div>` : ''}
            <div id="imagePreview" style="margin-top: 15px; display: none;">
              <img id="previewImg" style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 10px;">
            </div>
          </div>
          <div class="form-group">
            <label for="memoryTitle">Título *</label>
            <input 
              type="text" 
              id="memoryTitle" 
              name="title" 
              required 
              maxlength="100"
              value="${this.escapeHtml(memory.title || '')}"
            >
          </div>
          <div class="form-group">
            <label for="memoryDate">Fecha *</label>
            <input 
              type="date" 
              id="memoryDate" 
              name="date" 
              required
              value="${dateValue}"
            >
          </div>
          <div class="form-group">
            <label for="memoryContent">Contenido *</label>
            <textarea 
              id="memoryContent" 
              name="content" 
              required 
              rows="8"
            >${this.escapeHtml(memory.content || '')}</textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn-cancel" onclick="memoriesManager.displayMemoriesGrid()">
              Cancelar
            </button>
            <button type="submit" class="btn-save">
              Actualizar Recuerdo
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Maneja el submit del formulario de creación
   * @param {Event} event - Evento del formulario
   */
  async handleSubmit(event) {
    event.preventDefault();
    if (!this.currentImageFile) {
      alert('Debes seleccionar una foto para el recuerdo');
      return;
    }
    const title = document.getElementById('memoryTitle').value.trim();
    const content = document.getElementById('memoryContent').value.trim();
    const date = document.getElementById('memoryDate').value;
    const compressedImage = await this.compressImage(this.currentImageFile);
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    const { data: uploadData, error: uploadError } = await window.db.client.storage.from('memory-photos').upload(fileName, compressedImage, { contentType: 'image/jpeg' });
    if (uploadError) {
      alert('Error al subir la imagen. Intenta de nuevo.');
      console.error(uploadError);
      return;
    }
    const { data: urlData } = window.db.client.storage.from('memory-photos').getPublicUrl(fileName);
    const result = await window.db.createMemory({ title, content, date, image_url: urlData.publicUrl, image_path: fileName });
    if (result.success) {
      this.currentImageFile = null;
      await this.loadMemories();
      this.showSuccessMessage('¡Recuerdo guardado! ✨');
    } else {
      alert('Error al guardar el recuerdo. Intenta de nuevo.');
    }
  }

  /**
   * Maneja el submit del formulario de actualización
   * @param {Event} event - Evento del formulario
   * @param {string|number} id - ID del recuerdo
   */
  async handleUpdate(event, memoryId) {
    event.preventDefault();
    const title = document.getElementById('memoryTitle').value.trim();
    const content = document.getElementById('memoryContent').value.trim();
    const date = document.getElementById('memoryDate').value;
    let updateData = { title, content, date };
    if (this.currentImageFile) {
      const memory = this.memories.find(m => m.id == memoryId);
      if (memory && memory.image_path) {
        await window.db.client.storage.from('memory-photos').remove([memory.image_path]);
      }
      const compressedImage = await this.compressImage(this.currentImageFile);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await window.db.client.storage.from('memory-photos').upload(fileName, compressedImage, { contentType: 'image/jpeg' });
      if (uploadError) {
        alert('Error al subir la nueva imagen.');
        return;
      }
      const { data: urlData } = window.db.client.storage.from('memory-photos').getPublicUrl(fileName);
      updateData.image_url = urlData.publicUrl;
      updateData.image_path = fileName;
    }
    const result = await window.db.updateMemory(memoryId, updateData);
    if (result.success) {
      this.currentImageFile = null;
      await this.loadMemories();
      this.showSuccessMessage('¡Recuerdo actualizado! 💜');
    } else {
      alert('Error al actualizar el recuerdo.');
    }
  }

  /**
   * Muestra el detalle completo de un recuerdo
   * @param {string|number} id - ID del recuerdo
   */
  showMemoryDetail(id) {
    if (!this.contentDiv) return;

    const memory = this.memories.find(m => m.id == id);
    if (!memory) {
      this.showError('Recuerdo no encontrado.');
      return;
    }

    this.currentView = 'detail';

    const date = new Date(memory.date);
    const formattedDate = date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    this.contentDiv.innerHTML = `
      <div class="memory-detail">
        ${memory.image_url ? `<img src="${memory.image_url}" class="memory-detail-image" alt="${this.escapeHtml(memory.title)}">` : ''}
        <div class="memory-detail-header">
          <h2>${this.escapeHtml(memory.title || 'Sin título')}</h2>
          <button class="btn-edit" onclick="memoriesManager.showEditForm('${id}')">
            Editar
          </button>
        </div>
        <div class="memory-detail-date">${formattedDate}</div>
        <div class="memory-detail-content">
          ${this.escapeHtml(memory.content || '').replace(/\n/g, '<br>')}
        </div>
        <button class="btn-back" onclick="memoriesManager.displayMemoriesGrid()">
          ← Volver a todos los recuerdos
        </button>
      </div>
    `;
  }

  /**
   * Confirma antes de eliminar un recuerdo
   * @param {string|number} id - ID del recuerdo
   */
  async confirmDelete(id) {
    const memory = this.memories.find(m => m.id == id);
    const title = memory?.title || 'este recuerdo';
    
    if (!confirm(`¿Estás segura de que quieres eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    await this.deleteMemory(id);
  }

  /**
   * Elimina un recuerdo
   * @param {string|number} id - ID del recuerdo
   */
  async deleteMemory(id) {
    try {
      const result = await window.db.deleteMemory(id);

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar recuerdo');
      }

      this.showSuccessMessage('Recuerdo eliminado');
      await this.loadMemories();
    } catch (error) {
      console.error('Error al eliminar recuerdo:', error);
      this.showError('No se pudo eliminar el recuerdo. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Muestra un mensaje de éxito temporal
   * @param {string} message - Mensaje a mostrar
   */
  showSuccessMessage(message) {
    // Remover notificación anterior si existe
    const existing = document.querySelector('.success-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remover después de 3 segundos
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   * @param {Function} retryCallback - Función a ejecutar al hacer retry
   */
  showError(message, retryCallback = null) {
    if (!this.contentDiv) return;

    const retryButton = retryCallback ? `
      <button class="btn-retry" onclick="(${retryCallback.toString()})()">
        Reintentar
      </button>
    ` : '';

    this.contentDiv.innerHTML = `
      <div class="error-message">
        <div class="error-icon">❌</div>
        <h3>Error</h3>
        <p>${this.escapeHtml(message)}</p>
        ${retryButton}
        <button class="btn-back" onclick="memoriesManager.displayMemoriesGrid()">
          Volver
        </button>
      </div>
    `;
  }

  /**
   * Comprime una imagen antes de subirla
   * @param {File} file - Archivo de imagen
   * @returns {Promise<Blob>} - Imagen comprimida
   */
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  /**
   * Maneja la selección de imagen y muestra preview
   * @param {Event} event - Evento del input file
   */
  async handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('imagePreview').style.display = 'block';
    };
    reader.readAsDataURL(file);
    this.currentImageFile = file;
  }

  /**
   * Escapa HTML para prevenir XSS
   * @param {string} text - Texto a escapar
   * @returns {string} - Texto escapado
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Muestra opciones para compartir URL
   */
  showShareOptions() {
    // Obtener URL base dinámica (funciona en localhost y producción)
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?share=true`;
    
    const whatsappText = encodeURIComponent('¡Hola! Sube un recuerdo para compartir conmigo 💜');
    const whatsappUrl = `https://wa.me/?text=${whatsappText}%20${encodeURIComponent(shareUrl)}`;
    
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="share-modal-backdrop" onclick="this.parentElement.remove()"></div>
      <div class="share-modal-content">
        <h3>Compartir para subir recuerdo</h3>
        <button class="share-option-btn whatsapp-btn" onclick="window.open('${whatsappUrl}', '_blank')">
          <span style="font-size: 1.5em;">💬</span>
          Compartir por WhatsApp
        </button>
        <button class="share-option-btn copy-btn" onclick="memoriesManager.copyShareUrl('${shareUrl}', this)">
          <span style="font-size: 1.5em;">📋</span>
          Copiar enlace
        </button>
        <button class="share-cancel-btn" onclick="this.closest('.share-modal').remove()">
          Cancelar
        </button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Copia la URL compartida al portapapeles
   * @param {string} url - URL a copiar
   * @param {HTMLElement} button - Botón que activó la acción
   */
  copyShareUrl(url, button) {
    const originalText = button.innerHTML;
    const originalBackground = button.style.background;
    
    // Función para mostrar feedback de éxito
    const showSuccess = () => {
      button.innerHTML = '<span style="font-size: 1.5em;">✅</span> ¡Copiado!';
      button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      button.style.color = 'white';
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = originalBackground;
        button.style.color = '';
      }, 3000);
    };
    
    // Intentar usar Clipboard API (funciona en HTTPS y algunos navegadores móviles)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        showSuccess();
      }).catch(() => {
        // Si falla, usar método alternativo
        this.fallbackCopyText(url, button, originalText, originalBackground, showSuccess);
      });
    } else {
      // Usar método alternativo para navegadores que no soportan Clipboard API
      this.fallbackCopyText(url, button, originalText, originalBackground, showSuccess);
    }
  }
  
  /**
   * Método alternativo para copiar texto (compatible con móviles)
   * @param {string} text - Texto a copiar
   * @param {HTMLElement} button - Botón que activó la acción
   * @param {string} originalText - Texto original del botón
   * @param {string} originalBackground - Background original del botón
   * @param {Function} showSuccess - Función para mostrar éxito
   */
  fallbackCopyText(text, button, originalText, originalBackground, showSuccess) {
    // Crear input temporal
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    
    // Seleccionar y copiar
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showSuccess();
      } else {
        // Si falla, mostrar URL para que el usuario la copie manualmente
        alert(`No se pudo copiar automáticamente. La URL es:\n\n${text}\n\nPuedes copiarla manualmente.`);
      }
    } catch (err) {
      // Si falla, mostrar URL para que el usuario la copie manualmente
      alert(`No se pudo copiar automáticamente. La URL es:\n\n${text}\n\nPuedes copiarla manualmente.`);
    }
    
    // Limpiar
    document.body.removeChild(textArea);
  }
}

// Instancia global (se inicializará en DOMContentLoaded)
let memoriesManager = null;

// Detectar si es URL compartida
if (window.location.search.includes('share=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    // Ocultar todo excepto la página compartida
    document.querySelector('.container').style.display = 'none';
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    
    const sharedPage = document.getElementById('sharedMemoryPage');
    sharedPage.style.display = 'flex';
    sharedPage.classList.add('active');
    document.body.classList.add('modal-open');
    
    showSharedMemoryForm();
  });
}

function showSharedMemoryForm() {
  const content = document.getElementById('sharedMemoryContent');
  content.innerHTML = `
    <div class="form-container">
      <p style="text-align: center; color: #666; margin-bottom: 25px; line-height: 1.6;">
        Amanda va a poder ver este recuerdo 💜
      </p>
      <form id="sharedMemoryForm" onsubmit="handleSharedMemorySubmit(event)">
        <div class="form-group">
          <label for="sharedName">Tu nombre *</label>
          <input 
            type="text" 
            id="sharedName" 
            required 
            placeholder="¿Cómo te llamas?"
            maxlength="50"
          >
        </div>
        
        <div class="form-group">
          <label for="sharedImage">Foto del recuerdo *</label>
          <input 
            type="file" 
            id="sharedImage" 
            accept="image/*" 
            required
            onchange="handleSharedImageSelect(event)"
          >
          <div id="sharedImagePreview" style="margin-top: 15px; display: none;">
            <img id="sharedPreviewImg" style="width: 100%; max-height: 300px; object-fit: contain; border-radius: 10px;">
          </div>
        </div>
        
        <div class="form-group">
          <label for="sharedTitle">Título del recuerdo *</label>
          <input 
            type="text" 
            id="sharedTitle" 
            required 
            placeholder="Dale un título a este momento"
            maxlength="100"
          >
        </div>
        
        <div class="form-group">
          <label for="sharedDate">Fecha</label>
          <input 
            type="date" 
            id="sharedDate" 
            value="${new Date().toISOString().split('T')[0]}"
          >
        </div>
        
        <div class="form-group">
          <label for="sharedContent">Cuéntanos de este recuerdo *</label>
          <textarea 
            id="sharedContent" 
            required 
            rows="8"
            placeholder="Describe este momento especial..."
          ></textarea>
        </div>
        
        <div class="form-actions">
          <button type="submit" class="save-btn">
            💾 Compartir Recuerdo
          </button>
        </div>
      </form>
    </div>
  `;
}

let sharedImageFile = null;

function handleSharedImageSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('sharedPreviewImg').src = e.target.result;
    document.getElementById('sharedImagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
  sharedImageFile = file;
}

async function handleSharedMemorySubmit(event) {
  event.preventDefault();
  
  if (!sharedImageFile) {
    alert('Debes seleccionar una foto para el recuerdo');
    return;
  }
  
  const name = document.getElementById('sharedName').value.trim();
  const title = document.getElementById('sharedTitle').value.trim();
  const content = document.getElementById('sharedContent').value.trim();
  const date = document.getElementById('sharedDate').value;
  
  // Comprimir imagen
  const compressedImage = await compressSharedImage(sharedImageFile);
  
  // Subir a Supabase
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
  const { error: uploadError } = await window.db.client.storage
    .from('memory-photos')
    .upload(fileName, compressedImage, { contentType: 'image/jpeg' });
  
  if (uploadError) {
    alert('Error al subir la imagen. Intenta de nuevo.');
    return;
  }
  
  const { data: urlData } = window.db.client.storage
    .from('memory-photos')
    .getPublicUrl(fileName);
  
  // Guardar recuerdo con el nombre de quien lo sube
  const fullContent = `De: ${name}\n\n${content}`;
  
  const result = await window.db.createMemory({ 
    title, 
    content: fullContent, 
    date,
    image_url: urlData.publicUrl,
    image_path: fileName
  });
  
  if (result.success) {
    showSuccessMessage();
  } else {
    alert('Error al guardar el recuerdo. Intenta de nuevo.');
  }
}

async function compressSharedImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7);
      };
    };
  });
}

function showSuccessMessage() {
  const content = document.getElementById('sharedMemoryContent');
  content.innerHTML = `
    <div style="text-align: center; padding: 60px 20px;">
      <div style="font-size: 5em; margin-bottom: 20px;">✨</div>
      <h2 style="font-size: 2em; color: #28a745; margin-bottom: 20px;">
        ¡Tu recuerdo ya lo puede ver Amanda!
      </h2>
      <p style="font-size: 1.2em; color: #666; line-height: 1.8;">
        Gracias por compartir este momento especial 💜
      </p>
    </div>
  `;
}

