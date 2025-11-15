/**
 * Manager para los recordatorios
 * Maneja CRUD completo de recordatorios
 */
class RemindersManager {
  constructor() {
    this.modal = document.getElementById('remindersModal');
    this.contentDiv = this.modal?.querySelector('.content-div');
    this.reminders = [];
  }

  /**
   * Abre el modal y carga los recordatorios
   */
  async open() {
    if (!this.modal) return;
    
    this.modal.classList.add('active');
    document.body.classList.add('modal-open');
    await this.loadReminders();
  }

  /**
   * Cierra el modal
   */
  close() {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
    document.body.classList.remove('modal-open');
  }

  /**
   * Carga los recordatorios desde Supabase
   */
  async loadReminders() {
    if (!this.contentDiv) return;

    // Mostrar loading
    this.contentDiv.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando recordatorios...</p>
      </div>
    `;

    try {
      const result = await window.db.getAllReminders();

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar recordatorios');
      }

      this.reminders = result.data || [];
      this.displayReminders();
    } catch (error) {
      console.error('Error al cargar recordatorios:', error);
      this.showError('No se pudieron cargar los recordatorios. Por favor, intenta de nuevo.', () => {
        this.loadReminders();
      });
    }
  }

  /**
   * Muestra todos los recordatorios en una lista
   */
  displayReminders() {
    if (!this.contentDiv) return;

    // Ordenar: importantes primero (por important_at DESC), luego los demás
    const sortedReminders = [...this.reminders].sort((a, b) => {
      // Importantes primero
      if (a.is_important && !b.is_important) return -1;
      if (!a.is_important && b.is_important) return 1;
      
      // Si ambos son importantes, ordenar por important_at DESC
      if (a.is_important && b.is_important) {
        const aTime = a.important_at ? new Date(a.important_at).getTime() : 0;
        const bTime = b.important_at ? new Date(b.important_at).getTime() : 0;
        return bTime - aTime;
      }
      
      // Si ninguno es importante, ordenar por created_at DESC
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    });

    const remindersHTML = sortedReminders.length > 0 ? `
      <div class="reminders-list">
        ${sortedReminders.map(reminder => this.renderReminderItem(reminder)).join('')}
      </div>
    ` : '';

    const emptyState = sortedReminders.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🫟</div>
        <h3>No hay recordatorios aún</h3>
        <p>Agrega tu primer recordatorio usando el formulario de arriba.</p>
      </div>
    ` : '';

    this.contentDiv.innerHTML = `
      <div class="reminders-container">
        <h2>Recordatorios que no hay que olvidar</h2>
        <form class="reminder-form" onsubmit="remindersManager.handleAdd(event)">
          <input 
            type="text" 
            id="reminderInput" 
            placeholder="Escribe un recordatorio para ti..." 
            required
            maxlength="200"
          >
          <button type="submit" class="btn-add-reminder">Agregar</button>
        </form>
        ${emptyState}
        ${remindersHTML}
      </div>
    `;
  }

  /**
   * Renderiza un item de recordatorio
   * @param {Object} reminder - Objeto recordatorio
   * @returns {string} - HTML del item
   */
  renderReminderItem(reminder) {
    const isExample = reminder.is_example;
    const isImportant = reminder.is_important;
    const emoji = isImportant ? '✨' : '🫟';
    const importantClass = isImportant ? 'reminder-important' : '';
    const canEdit = !isExample;
    const canDelete = !isExample;

    return `
      <div class="reminder-item ${importantClass}" data-id="${reminder.id}">
        <div class="reminder-emoji">${emoji}</div>
        <div class="reminder-content-wrapper">
          <span class="reminder-text">${this.escapeHtml(reminder.content || '')}</span>
          <div class="reminder-actions">
            <label class="important-checkbox-label" title="Muy importante">
              <input 
                type="checkbox" 
                class="important-checkbox"
                ${isImportant ? 'checked' : ''}
                ${canEdit ? `onchange="remindersManager.toggleImportant('${reminder.id}', this.checked)"` : 'disabled'}
              >
              <span class="important-label-text">Muy importante</span>
            </label>
            ${canEdit ? `
              <button class="btn-edit-small" onclick="remindersManager.showEditDialog('${reminder.id}')" title="Editar">
                ✏️
              </button>
            ` : ''}
            ${canDelete ? `
              <button class="btn-delete-small" onclick="remindersManager.confirmDelete('${reminder.id}')" title="Eliminar">
                🗑️
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Maneja la adición de un nuevo recordatorio
   * @param {Event} event - Evento del formulario
   */
  async handleAdd(event) {
    event.preventDefault();
    
    const input = document.getElementById('reminderInput');
    const content = input.value.trim();

    if (!content) {
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Agregando...';

    try {
      const result = await window.db.createReminder(content);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear recordatorio');
      }

      input.value = '';
      await this.loadReminders();
      this.showSuccessMessage('Recordatorio agregado ✨');
    } catch (error) {
      console.error('Error al crear recordatorio:', error);
      this.showError('No se pudo agregar el recordatorio. Por favor, intenta de nuevo.');
      submitButton.disabled = false;
      submitButton.textContent = 'Agregar';
    }
  }

  /**
   * Cambia el estado de importante de un recordatorio
   * @param {string|number} id - ID del recordatorio
   * @param {boolean} isImportant - Nuevo estado
   */
  async toggleImportant(id, isImportant) {
    try {
      const updates = {
        is_important: isImportant,
        important_at: isImportant ? new Date().toISOString() : null
      };

      const result = await window.db.updateReminder(id, updates);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar recordatorio');
      }

      await this.loadReminders();
    } catch (error) {
      console.error('Error al actualizar recordatorio:', error);
      this.showError('No se pudo actualizar el recordatorio. Por favor, intenta de nuevo.');
      // Revertir checkbox
      const checkbox = document.querySelector(`.important-checkbox[onchange*="${id}"]`);
      if (checkbox) {
        checkbox.checked = !isImportant;
      }
    }
  }

  /**
   * Muestra un editor para editar un recordatorio
   * @param {string|number} id - ID del recordatorio
   */
  showEditDialog(id) {
    const reminder = this.reminders.find(r => r.id == id);
    if (!reminder) {
      this.showError('Recordatorio no encontrado.');
      return;
    }

    if (reminder.is_example) {
      alert('Este recordatorio no se puede editar.');
      return;
    }

    // Guardar el HTML actual para poder restaurarlo
    const currentHTML = this.contentDiv.innerHTML;

    // Crear el editor
    this.contentDiv.innerHTML = `
      <div class="reminders-container">
        <div class="edit-reminder-card">
          <div class="edit-reminder-header">
            <h3>✏️ Editar Recordatorio</h3>
            <button class="close-edit-btn" onclick="remindersManager.cancelEdit()" aria-label="Cerrar">×</button>
          </div>
          <form class="edit-reminder-form" onsubmit="remindersManager.handleEditSubmit(event, '${id}')">
            <div class="form-group">
              <label for="editReminderContent">Tu recordatorio</label>
              <textarea 
                id="editReminderContent" 
                required 
                rows="6"
                maxlength="500"
                placeholder="Escribe tu recordatorio aquí..."
                autofocus
              >${this.escapeHtml(reminder.content || '')}</textarea>
              <div class="char-count">
                <span id="editCharCount">${(reminder.content || '').length}</span> / 500
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel" onclick="remindersManager.cancelEdit()">
                Cancelar
              </button>
              <button type="submit" class="btn-save">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Guardar referencia para restaurar
    this.previousView = currentHTML;

    // Agregar contador de caracteres
    const textarea = document.getElementById('editReminderContent');
    const charCount = document.getElementById('editCharCount');
    if (textarea && charCount) {
      textarea.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
      });
    }

    // Auto-focus y scroll al textarea
    if (textarea) {
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
      }, 100);
    }
  }

  /**
   * Cancela la edición y restaura la vista anterior
   */
  cancelEdit() {
    if (this.previousView) {
      this.contentDiv.innerHTML = this.previousView;
      this.previousView = null;
    } else {
      this.loadReminders();
    }
  }

  /**
   * Maneja el submit del formulario de edición
   * @param {Event} event - Evento del formulario
   * @param {string|number} id - ID del recordatorio
   */
  async handleEditSubmit(event, id) {
    event.preventDefault();
    
    const textarea = document.getElementById('editReminderContent');
    const trimmedContent = textarea.value.trim();

    if (!trimmedContent) {
      alert('El recordatorio no puede estar vacío.');
      return;
    }

    const reminder = this.reminders.find(r => r.id == id);
    if (trimmedContent === reminder.content) {
      // No hay cambios, solo cerrar
      this.cancelEdit();
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Guardando...';

    await this.updateReminder(id, { content: trimmedContent });
    this.previousView = null; // Limpiar referencia
  }

  /**
   * Actualiza un recordatorio
   * @param {string|number} id - ID del recordatorio
   * @param {Object} updates - Objeto con campos a actualizar
   */
  async updateReminder(id, updates) {
    try {
      const result = await window.db.updateReminder(id, updates);

      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar recordatorio');
      }

      // Limpiar referencia de vista anterior si existe
      this.previousView = null;
      
      await this.loadReminders();
      this.showSuccessMessage('Recordatorio actualizado ✨');
    } catch (error) {
      console.error('Error al actualizar recordatorio:', error);
      this.showError('No se pudo actualizar el recordatorio. Por favor, intenta de nuevo.');
    }
  }

  /**
   * Confirma antes de eliminar un recordatorio
   * @param {string|number} id - ID del recordatorio
   */
  async confirmDelete(id) {
    const reminder = this.reminders.find(r => r.id == id);
    
    if (!reminder) {
      this.showError('Recordatorio no encontrado.');
      return;
    }

    if (reminder.is_example) {
      alert('Este recordatorio no se puede eliminar.');
      return;
    }

    const content = reminder.content || 'este recordatorio';
    
    if (!confirm(`¿Estás segura de que quieres eliminar "${content}"?`)) {
      return;
    }

    await this.deleteReminder(id);
  }

  /**
   * Elimina un recordatorio
   * @param {string|number} id - ID del recordatorio
   */
  async deleteReminder(id) {
    try {
      const result = await window.db.deleteReminder(id);

      if (!result.success) {
        throw new Error(result.error || 'Error al eliminar recordatorio');
      }

      await this.loadReminders();
      this.showSuccessMessage('Recordatorio eliminado');
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      this.showError('No se pudo eliminar el recordatorio. Por favor, intenta de nuevo.');
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
        <button class="btn-back" onclick="remindersManager.loadReminders()">
          Volver
        </button>
      </div>
    `;
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
}

// Instancia global (se inicializará en DOMContentLoaded)
let remindersManager = null;
