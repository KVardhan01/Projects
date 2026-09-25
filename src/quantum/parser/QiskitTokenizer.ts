export type TokenType =
  | 'KEYWORD'
  | 'IDENTIFIER'
  | 'DOT'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'NUMBER'
  | 'STRING'
  | 'ASSIGN'
  | 'COMMENT'
  | 'NEWLINE'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export class QiskitTokenizer {
  static tokenize(source: string): Token[] {
    const tokens: Token[] = [];
    let line = 1;
    let col = 1;
    let i = 0;

    while (i < source.length) {
      const char = source[i];

      // Newlines
      if (char === '\n') {
        tokens.push({ type: 'NEWLINE', value: '\n', line, col });
        line++;
        col = 1;
        i++;
        continue;
      }

      // Whitespace
      if (/\s/.test(char)) {
        col++;
        i++;
        continue;
      }

      // Comments
      if (char === '#') {
        let comment = '';
        while (i < source.length && source[i] !== '\n') {
          comment += source[i];
          i++;
        }
        tokens.push({ type: 'COMMENT', value: comment, line, col });
        col += comment.length;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        let numStr = '';
        const startCol = col;
        while (i < source.length && /[0-9.]/.test(source[i])) {
          numStr += source[i];
          i++;
          col++;
        }
        tokens.push({ type: 'NUMBER', value: numStr, line, col: startCol });
        continue;
      }

      // Identifiers / Keywords
      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        const startCol = col;
        while (i < source.length && /[a-zA-Z0-9_]/.test(source[i])) {
          idStr += source[i];
          i++;
          col++;
        }

        const isKeyword = ['from', 'import', 'QuantumCircuit', 'as'].includes(idStr);
        tokens.push({
          type: isKeyword ? 'KEYWORD' : 'IDENTIFIER',
          value: idStr,
          line,
          col: startCol,
        });
        continue;
      }

      // Symbols
      if (char === '.') {
        tokens.push({ type: 'DOT', value: '.', line, col });
        i++;
        col++;
        continue;
      }
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', line, col });
        i++;
        col++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', line, col });
        i++;
        col++;
        continue;
      }
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', line, col });
        i++;
        col++;
        continue;
      }
      if (char === '=') {
        tokens.push({ type: 'ASSIGN', value: '=', line, col });
        i++;
        col++;
        continue;
      }

      // Unknown character, skip
      i++;
      col++;
    }

    tokens.push({ type: 'EOF', value: '', line, col });
    return tokens;
  }
}
