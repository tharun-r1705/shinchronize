const Groq = require('groq-sdk');

/**
 * Centralized Groq Client with Automatic Fallback
 * 
 * Features:
 * - Automatic retry with backup API key on primary failure
 * - Circuit breaker pattern to avoid repeatedly hitting failed keys
 * - Comprehensive logging for monitoring
 * - Support for chat completions, transcription, and TTS
 */

class GroqClientWrapper {
  constructor() {
    // Initialize primary client
    this.primaryKey = process.env.GROQ_API_KEY;
    this.backupKey = process.env.GROQ_API_KEY_BACKUP;
    
    this.primaryClient = this.primaryKey ? new Groq({ apiKey: this.primaryKey }) : null;
    this.backupClient = this.backupKey ? new Groq({ apiKey: this.backupKey }) : null;
    
    // Circuit breaker state
    this.primaryFailureCount = 0;
    this.backupFailureCount = 0;
    this.primaryCircuitOpen = false;
    this.backupCircuitOpen = false;
    this.circuitResetTime = null;
    
    // Configuration
    this.FAILURE_THRESHOLD = 5;
    this.CIRCUIT_TIMEOUT = 60000; // 60 seconds
    
    // Stats for monitoring
    this.stats = {
      primaryRequests: 0,
      backupRequests: 0,
      primaryFailures: 0,
      backupFailures: 0,
      totalRequests: 0
    };
  }

  /**
   * Check if any API client is available
   */
  isAvailable() {
    return this.primaryClient !== null || this.backupClient !== null;
  }

  /**
   * Get current statistics
   */
  getStats() {
    return {
      ...this.stats,
      primaryCircuitOpen: this.primaryCircuitOpen,
      backupCircuitOpen: this.backupCircuitOpen,
      primaryFailureCount: this.primaryFailureCount,
      backupFailureCount: this.backupFailureCount
    };
  }

  /**
   * Check and reset circuit breaker if timeout has passed
   */
  checkCircuitBreaker() {
    if (this.circuitResetTime && Date.now() >= this.circuitResetTime) {
      console.log('[GroqClient] Circuit breaker timeout reached, attempting reset');
      this.primaryCircuitOpen = false;
      this.backupCircuitOpen = false;
      this.primaryFailureCount = 0;
      this.backupFailureCount = 0;
      this.circuitResetTime = null;
    }
  }

  /**
   * Record a failure and potentially open circuit breaker
   */
  recordFailure(isPrimary) {
    if (isPrimary) {
      this.primaryFailureCount++;
      this.stats.primaryFailures++;
      
      if (this.primaryFailureCount >= this.FAILURE_THRESHOLD) {
        this.primaryCircuitOpen = true;
        this.circuitResetTime = Date.now() + this.CIRCUIT_TIMEOUT;
        console.error(`[GroqClient] Primary key circuit breaker opened after ${this.primaryFailureCount} failures. Will retry after ${this.CIRCUIT_TIMEOUT}ms`);
      }
    } else {
      this.backupFailureCount++;
      this.stats.backupFailures++;
      
      if (this.backupFailureCount >= this.FAILURE_THRESHOLD) {
        this.backupCircuitOpen = true;
        this.circuitResetTime = Date.now() + this.CIRCUIT_TIMEOUT;
        console.error(`[GroqClient] Backup key circuit breaker opened after ${this.backupFailureCount} failures. Will retry after ${this.CIRCUIT_TIMEOUT}ms`);
      }
    }
  }

  /**
   * Record a successful request
   */
  recordSuccess(isPrimary) {
    if (isPrimary) {
      this.stats.primaryRequests++;
      // Reset failure count on success
      if (this.primaryFailureCount > 0) {
        console.log(`[GroqClient] Primary key recovered after ${this.primaryFailureCount} failures`);
        this.primaryFailureCount = 0;
      }
    } else {
      this.stats.backupRequests++;
      // Reset failure count on success
      if (this.backupFailureCount > 0) {
        console.log(`[GroqClient] Backup key recovered after ${this.backupFailureCount} failures`);
        this.backupFailureCount = 0;
      }
    }
    this.stats.totalRequests++;
  }

  /**
   * Create chat completion with automatic fallback
   */
  async createChatCompletion(options) {
    this.checkCircuitBreaker();
    
    // Try primary first if available and circuit is closed
    if (this.primaryClient && !this.primaryCircuitOpen) {
      try {
        const result = await this.primaryClient.chat.completions.create(options);
        this.recordSuccess(true);
        return result;
      } catch (error) {
        console.error('[GroqClient] Primary key failed:', error.message);
        this.recordFailure(true);
        
        // Try backup if available
        if (this.backupClient && !this.backupCircuitOpen) {
          console.log('[GroqClient] Attempting with backup key...');
          try {
            const result = await this.backupClient.chat.completions.create(options);
            this.recordSuccess(false);
            return result;
          } catch (backupError) {
            console.error('[GroqClient] Backup key also failed:', backupError.message);
            this.recordFailure(false);
            throw new Error(`Both API keys failed. Primary: ${error.message}, Backup: ${backupError.message}`);
          }
        }
        
        // No backup available, throw original error
        throw error;
      }
    }
    
    // Primary unavailable or circuit open, try backup
    if (this.backupClient && !this.backupCircuitOpen) {
      console.log('[GroqClient] Using backup key (primary unavailable or circuit open)');
      try {
        const result = await this.backupClient.chat.completions.create(options);
        this.recordSuccess(false);
        return result;
      } catch (error) {
        console.error('[GroqClient] Backup key failed:', error.message);
        this.recordFailure(false);
        throw error;
      }
    }
    
    // No clients available
    throw new Error('Groq API is not configured. Please set GROQ_API_KEY or GROQ_API_KEY_BACKUP.');
  }

  /**
   * Create audio transcription with automatic fallback
   */
  async createTranscription(options) {
    this.checkCircuitBreaker();
    
    // Try primary first
    if (this.primaryClient && !this.primaryCircuitOpen) {
      try {
        const result = await this.primaryClient.audio.transcriptions.create(options);
        this.recordSuccess(true);
        return result;
      } catch (error) {
        console.error('[GroqClient] Primary transcription failed:', error.message);
        this.recordFailure(true);
        
        // Try backup
        if (this.backupClient && !this.backupCircuitOpen) {
          console.log('[GroqClient] Attempting transcription with backup key...');
          try {
            const result = await this.backupClient.audio.transcriptions.create(options);
            this.recordSuccess(false);
            return result;
          } catch (backupError) {
            console.error('[GroqClient] Backup transcription also failed:', backupError.message);
            this.recordFailure(false);
            throw new Error(`Both API keys failed for transcription. Primary: ${error.message}, Backup: ${backupError.message}`);
          }
        }
        
        throw error;
      }
    }
    
    // Try backup
    if (this.backupClient && !this.backupCircuitOpen) {
      console.log('[GroqClient] Using backup key for transcription');
      try {
        const result = await this.backupClient.audio.transcriptions.create(options);
        this.recordSuccess(false);
        return result;
      } catch (error) {
        console.error('[GroqClient] Backup transcription failed:', error.message);
        this.recordFailure(false);
        throw error;
      }
    }
    
    throw new Error('Groq API is not configured for transcription.');
  }

  /**
   * Create text-to-speech with automatic fallback
   */
  async createSpeech(options) {
    this.checkCircuitBreaker();
    
    // Try primary first
    if (this.primaryClient && !this.primaryCircuitOpen) {
      try {
        const result = await this.primaryClient.audio.speech.create(options);
        this.recordSuccess(true);
        return result;
      } catch (error) {
        console.error('[GroqClient] Primary TTS failed:', error.message);
        this.recordFailure(true);
        
        // Try backup
        if (this.backupClient && !this.backupCircuitOpen) {
          console.log('[GroqClient] Attempting TTS with backup key...');
          try {
            const result = await this.backupClient.audio.speech.create(options);
            this.recordSuccess(false);
            return result;
          } catch (backupError) {
            console.error('[GroqClient] Backup TTS also failed:', backupError.message);
            this.recordFailure(false);
            throw new Error(`Both API keys failed for TTS. Primary: ${error.message}, Backup: ${backupError.message}`);
          }
        }
        
        throw error;
      }
    }
    
    // Try backup
    if (this.backupClient && !this.backupCircuitOpen) {
      console.log('[GroqClient] Using backup key for TTS');
      try {
        const result = await this.backupClient.audio.speech.create(options);
        this.recordSuccess(false);
        return result;
      } catch (error) {
        console.error('[GroqClient] Backup TTS failed:', error.message);
        this.recordFailure(false);
        throw error;
      }
    }
    
    throw new Error('Groq API is not configured for TTS.');
  }

  /**
   * Legacy compatibility: Access to chat completions create method
   */
  get chat() {
    return {
      completions: {
        create: (options) => this.createChatCompletion(options)
      }
    };
  }

  /**
   * Legacy compatibility: Access to audio methods
   */
  get audio() {
    return {
      transcriptions: {
        create: (options) => this.createTranscription(options)
      },
      speech: {
        create: (options) => this.createSpeech(options)
      }
    };
  }
}

// Export singleton instance
const groqClient = new GroqClientWrapper();

// Log initial configuration (without exposing keys)
if (groqClient.primaryClient) {
  console.log('[GroqClient] Primary Groq API key configured');
}
if (groqClient.backupClient) {
  console.log('[GroqClient] Backup Groq API key configured');
}
if (!groqClient.isAvailable()) {
  console.warn('[GroqClient] WARNING: No Groq API keys configured. AI features will be unavailable.');
}

module.exports = groqClient;
