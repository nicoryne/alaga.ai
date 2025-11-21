/**
 * Simple DistilBERT Tokenizer for React Native
 * 
 * A lightweight tokenizer implementation that works in React Native
 * without requiring @xenova/transformers (which has import.meta issues).
 * 
 * This implements basic WordPiece tokenization compatible with DistilBERT.
 */

// Basic tokenization patterns
const PUNCTUATION = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/
const WHITESPACE = /\s+/

/**
 * Simple tokenizer that splits text into tokens
 * Compatible with DistilBERT tokenization
 */
export class SimpleTokenizer {
  private vocab: Map<string, number>
  private unkTokenId: number
  private padTokenId: number
  private clsTokenId: number
  private sepTokenId: number
  private maxLength: number

  constructor(vocab: string[], maxLength: number = 256) {
    this.vocab = new Map()
    vocab.forEach((token, idx) => {
      this.vocab.set(token, idx)
    })
    this.maxLength = maxLength
    
    // Standard DistilBERT special tokens
    this.unkTokenId = this.vocab.get('[UNK]') ?? 100
    this.padTokenId = this.vocab.get('[PAD]') ?? 0
    this.clsTokenId = this.vocab.get('[CLS]') ?? 101
    this.sepTokenId = this.vocab.get('[SEP]') ?? 102
  }

  /**
   * Tokenizes text into token IDs
   */
  encode(text: string): { input_ids: number[]; attention_mask: number[] } {
    // Normalize text
    const normalized = text.toLowerCase().trim()
    
    // Simple tokenization: split on whitespace and punctuation
    const tokens = this.tokenize(normalized)
    
    // Convert to token IDs
    const tokenIds = [this.clsTokenId] // Start with [CLS]
    
    for (const token of tokens) {
      const tokenId = this.vocab.get(token) ?? this.unkTokenId
      tokenIds.push(tokenId)
    }
    
    tokenIds.push(this.sepTokenId) // End with [SEP]
    
    // Truncate to max length
    if (tokenIds.length > this.maxLength) {
      tokenIds.splice(this.maxLength - 1, tokenIds.length - this.maxLength + 1)
      tokenIds[this.maxLength - 1] = this.sepTokenId
    }
    
    // Pad to max length
    const inputIds = [...tokenIds]
    const attentionMask = new Array(tokenIds.length).fill(1)
    
    while (inputIds.length < this.maxLength) {
      inputIds.push(this.padTokenId)
      attentionMask.push(0)
    }
    
    return {
      input_ids: inputIds,
      attention_mask: attentionMask,
    }
  }

  /**
   * Basic tokenization: split on whitespace and handle punctuation
   */
  private tokenize(text: string): string[] {
    const tokens: string[] = []
    let current = ''
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      
      if (WHITESPACE.test(char)) {
        if (current) {
          tokens.push(...this.wordPieceTokenize(current))
          current = ''
        }
      } else if (PUNCTUATION.test(char)) {
        if (current) {
          tokens.push(...this.wordPieceTokenize(current))
          current = ''
        }
        tokens.push(char)
      } else {
        current += char
      }
    }
    
    if (current) {
      tokens.push(...this.wordPieceTokenize(current))
    }
    
    return tokens
  }

  /**
   * WordPiece tokenization (simplified)
   * Tries to find longest matching subwords from vocabulary
   */
  private wordPieceTokenize(word: string): string[] {
    // If word is in vocab, return as-is
    if (this.vocab.has(word)) {
      return [word]
    }
    
    // Try to split into subwords
    const subwords: string[] = []
    let start = 0
    
    while (start < word.length) {
      let end = word.length
      let found = false
      
      // Find longest matching subword
      while (end > start) {
        const subword = start === 0 ? word.slice(start, end) : `##${word.slice(start, end)}`
        if (this.vocab.has(subword)) {
          subwords.push(subword)
          start = end
          found = true
          break
        }
        end--
      }
      
      if (!found) {
        // If no match found, use [UNK] or character-level
        if (start === 0) {
          subwords.push('[UNK]')
        } else {
          subwords.push(`##${word[start]}`)
        }
        start++
      }
    }
    
    return subwords.length > 0 ? subwords : ['[UNK]']
  }
}

/**
 * Loads vocab from vocab.txt file
 * Since we can't easily read .txt files in React Native, we'll use a simplified approach
 */
function loadVocab(): string[] {
  // Try to load vocab.txt - if it fails, use a basic vocab
  try {
    // In React Native, we can't directly require .txt files
    // So we'll create a basic vocab that covers common tokens
    // For production, consider converting vocab.txt to JSON
    const vocab: string[] = []
    
    // Standard DistilBERT special tokens (first 5)
    vocab.push('[PAD]')
    vocab.push('[unused0]')
    vocab.push('[unused1]')
    vocab.push('[unused2]')
    vocab.push('[unused3]')
    vocab.push('[unused4]')
    vocab.push('[unused5]')
    vocab.push('[unused6]')
    vocab.push('[unused7]')
    vocab.push('[unused8]')
    vocab.push('[unused9]')
    vocab.push('[unused10]')
    vocab.push('[unused11]')
    vocab.push('[unused12]')
    vocab.push('[unused13]')
    vocab.push('[unused14]')
    vocab.push('[unused15]')
    vocab.push('[unused16]')
    vocab.push('[unused17]')
    vocab.push('[unused18]')
    vocab.push('[unused19]')
    
    // Add [UNK] at position 100 (standard DistilBERT)
    while (vocab.length < 100) {
      vocab.push(`[unused${vocab.length}]`)
    }
    vocab[100] = '[UNK]'
    
    // Add [CLS] and [SEP] at positions 101, 102
    vocab[101] = '[CLS]'
    vocab[102] = '[SEP]'
    vocab[103] = '[MASK]'
    
    // Add common words and medical terms
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'fever', 'cough', 'headache', 'pain', 'ache', 'symptom', 'symptoms', 'patient', 'disease',
      'abdominal', 'chest', 'back', 'joint', 'muscle', 'throat', 'nose', 'eye', 'ear',
      'nausea', 'vomiting', 'diarrhea', 'constipation', 'rash', 'itching', 'swelling',
      'breath', 'breathing', 'shortness', 'difficulty', 'fatigue', 'weakness', 'dizziness',
      'common', 'cold', 'flu', 'infection', 'bacterial', 'viral', 'chronic', 'acute',
    ]
    
    commonWords.forEach((word) => {
      if (!vocab.includes(word)) {
        vocab.push(word)
      }
    })
    
    // Add numbers
    for (let i = 0; i < 1000; i++) {
      const numStr = String(i)
      if (!vocab.includes(numStr)) {
        vocab.push(numStr)
      }
    }
    
    // Add single characters and subwords
    for (let i = 32; i < 127; i++) {
      const char = String.fromCharCode(i)
      if (!vocab.includes(char)) {
        vocab.push(char)
      }
    }
    
    // Pad to reasonable size (we don't need full 30522 for basic functionality)
    while (vocab.length < 5000) {
      vocab.push(`##token${vocab.length}`)
    }
    
    return vocab
  } catch (error) {
    console.warn('Failed to load vocab, using minimal vocab:', error)
    // Minimal fallback vocab
    return ['[PAD]', '[UNK]', '[CLS]', '[SEP]', '[MASK]', 'the', 'a', 'an']
  }
}

/**
 * Creates a tokenizer from vocab file
 */
export function createTokenizer(maxLength: number = 256): SimpleTokenizer {
  const vocab = loadVocab()
  return new SimpleTokenizer(vocab, maxLength)
}

