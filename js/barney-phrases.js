/**
 * Manager para las frases de Barney
 * Maneja la visualización y navegación de frases
 */
class BarneyPhrasesManager {
  constructor() {
    this.modal = document.getElementById('barneyModal');
    this.contentDiv = this.modal?.querySelector('.content-div');
    this.phrases = [];
    this.currentView = 'grid'; // 'grid' | 'detail'
  }

  /**
   * Abre el modal y carga las frases
   */
  async open() {
    if (!this.modal) return;
    
    this.modal.classList.add('active');
    document.body.classList.add('modal-open');
    this.currentView = 'grid';
    await this.loadPhrases();
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
  }

  /**
   * Carga las frases desde Supabase
   */
  async loadPhrases() {
    if (!this.contentDiv) return;

    // Mostrar loading
    this.contentDiv.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Cargando frases...</p>
      </div>
    `;

    try {
      const result = await window.db.getAllPhrases();

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar frases');
      }

      this.phrases = result.data || [];
      this.displayPhrasesGrid();
    } catch (error) {
      console.error('Error al cargar frases:', error);
      this.showError('No se pudieron cargar las frases. Por favor, intenta de nuevo.', () => {
        this.loadPhrases();
      });
    }
  }

  /**
   * Muestra el grid de frases
   */
  displayPhrasesGrid() {
    if (!this.contentDiv) return;

    if (this.phrases.length === 0) {
      this.contentDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🎺</div>
          <h3>No hay frases disponibles</h3>
          <p>Aún no se han agregado frases.</p>
        </div>
      `;
      return;
    }

    // Filtrar duplicados: mantener solo la primera ocurrencia de cada título o ID único
    const seenTitles = new Set();
    const seenIds = new Set();
    const uniquePhrases = this.phrases.filter(phrase => {
      // Normalizar título: quitar espacios extra, convertir a minúsculas
      const title = (phrase.phrase_title || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const id = phrase.id;
      
      // Si ya vimos este ID, saltarlo
      if (id && seenIds.has(id)) {
        return false;
      }
      
      // Si ya vimos este título (y tiene título), saltarlo
      if (title && seenTitles.has(title)) {
        return false;
      }
      
      // Agregar a los sets
      if (id) seenIds.add(id);
      if (title) seenTitles.add(title);
      
      return true;
    });

    const phrasesHTML = uniquePhrases.map(phrase => {
      const preview = this.escapeHtml(phrase.phrase_text || '').substring(0, 60);
      const ellipsis = (phrase.phrase_text || '').length > 60 ? '...' : '';

      return `
        <div class="phrase-card" onclick="barneyManager.showPhraseDetail('${phrase.id}')">
          <div class="phrase-number">${phrase.phrase_number || ''}</div>
          <h3 class="phrase-title">${this.escapeHtml(phrase.phrase_title || 'Sin título')}</h3>
          <p class="phrase-preview">${preview}${ellipsis}</p>
        </div>
      `;
    }).join('');

    this.contentDiv.innerHTML = `
      <p style="text-align: center; font-size: 1.1em; color: #666; margin-bottom: 25px; line-height: 1.6;">Quiero decirte algo con cada frase, da click en la que quieras ver</p>
      <div class="phrases-grid">
        ${phrasesHTML}
      </div>
    `;
  }

  /**
   * Muestra el detalle de una frase
   * @param {string|number} id - ID de la frase
   */
  async showPhraseDetail(id) {
    if (!this.contentDiv) return;

    // Buscar frase en el array cargado
    let phrase = this.phrases.find(p => p.id == id);
    
    if (!phrase) {
      // Si no está en el array, intentar cargarla desde la DB
      const result = await window.db.getPhraseById(id);
      if (!result.success || !result.data) {
        this.showError('No se pudo cargar la frase.');
        return;
      }
      phrase = result.data;
    }

    this.currentView = 'detail';

    const phraseText = this.escapeHtml(phrase.phrase_text || '');
    const responseText = this.escapeHtml(phrase.response_text || '');

    this.contentDiv.innerHTML = `
      <div class="phrase-detail">
        <div class="phrase-icon">🎺</div>
        <div class="phrase-content">
          <div class="phrase-text-box">
            <p class="phrase-text">${phraseText}</p>
          </div>
          ${responseText ? `
            <div class="response-box">
              <p class="response-text">${responseText}</p>
            </div>
          ` : ''}
        </div>
        <button class="btn-back" onclick="barneyManager.displayPhrasesGrid()">
          ← Volver a todas las frases
        </button>
      </div>
    `;
  }

  /**
   * Muestra un mensaje de error con opción de reintentar
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
let barneyManager = null;

