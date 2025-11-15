/**
 * Cliente Supabase Singleton
 * Maneja todas las operaciones de base de datos
 */
class SupabaseClient {
  constructor() {
    if (!window.supabase) {
      throw new Error('Supabase no está cargado. Asegúrate de incluir el CDN en el HTML.');
    }
    
    if (!window.SUPABASE_CONFIG) {
      throw new Error('SUPABASE_CONFIG no está definido. Carga config.js primero.');
    }

    this.client = window.supabase.createClient(
      window.SUPABASE_CONFIG.url,
      window.SUPABASE_CONFIG.anonKey
    );
  }

  // ========== BARNEY PHRASES ==========

  /**
   * Obtiene todas las frases ordenadas por número
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getAllPhrases() {
    try {
      const { data, error } = await this.client
        .from('barney_phrases')
        .select('*')
        .order('phrase_number', { ascending: true });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener frases:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene una frase por ID
   * @param {string|number} id - ID de la frase
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getPhraseById(id) {
    try {
      const { data, error } = await this.client
        .from('barney_phrases')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener frase:', error);
      return { success: false, error: error.message };
    }
  }

  // ========== AMANDA MEMORIES ==========

  /**
   * Obtiene todos los recuerdos ordenados por fecha descendente
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getAllMemories() {
    try {
      const { data, error } = await this.client
        .from('amanda_memories')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener recuerdos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea un nuevo recuerdo
   * @param {Object} memory - Objeto con title, content, date
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async createMemory(memory) {
    try {
      const { data, error } = await this.client
        .from('amanda_memories')
        .insert([{
          title: memory.title,
          content: memory.content,
          date: memory.date,
          image_url: memory.image_url,
          image_path: memory.image_path
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al crear recuerdo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza un recuerdo existente
   * @param {string|number} id - ID del recuerdo
   * @param {Object} updates - Objeto con campos a actualizar
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async updateMemory(id, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      if (updates.image_url !== undefined) {
        updateData.image_url = updates.image_url;
      }
      if (updates.image_path !== undefined) {
        updateData.image_path = updates.image_path;
      }
      const { data, error } = await this.client
        .from('amanda_memories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al actualizar recuerdo:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Elimina un recuerdo
   * @param {string|number} id - ID del recuerdo
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteMemory(id) {
    try {
      const { data: memory } = await this.client.from('amanda_memories').select('image_path').eq('id', id).single();
      if (memory && memory.image_path) {
        await this.client.storage.from('memory-photos').remove([memory.image_path]);
      }
      const { error } = await this.client.from('amanda_memories').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return { success: false, error };
    }
  }

  // ========== REMINDERS ==========

  /**
   * Obtiene todos los recordatorios ordenados por fecha de creación descendente
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  async getAllReminders() {
    try {
      const { data, error } = await this.client
        .from('reminders')
        .select('*')
        .order('is_important', { ascending: false })
        .order('important_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al obtener recordatorios:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Crea un nuevo recordatorio
   * @param {string} content - Contenido del recordatorio
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async createReminder(content) {
    try {
      const { data, error } = await this.client
        .from('reminders')
        .insert([{
          content: content,
          is_completed: false
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al crear recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Actualiza un recordatorio
   * @param {string|number} id - ID del recordatorio
   * @param {Object} updates - Objeto con campos a actualizar
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async updateReminder(id, updates) {
    try {
      const { data, error } = await this.client
        .from('reminders')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error al actualizar recordatorio:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cambia el estado de completado de un recordatorio
   * @param {string|number} id - ID del recordatorio
   * @param {boolean} isCompleted - Nuevo estado
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async toggleReminderComplete(id, isCompleted) {
    return this.updateReminder(id, { is_completed: isCompleted });
  }

  /**
   * Elimina un recordatorio
   * @param {string|number} id - ID del recordatorio
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteReminder(id) {
    try {
      const { error } = await this.client
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error al eliminar recordatorio:', error);
      return { success: false, error: error.message };
    }
  }
}

// Crear instancia singleton y exportar a window
let dbInstance = null;

function getDB() {
  if (!dbInstance) {
    dbInstance = new SupabaseClient();
  }
  return dbInstance;
}

window.db = getDB();

