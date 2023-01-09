/* 
  webLISP, 2022-2023 by Andreas Schwenk <contact@compiler-construction.com>
  LICENSE: GPLv3 
*/

/**
 * This file implements a simple scanner.
 * Method next() fetches the next token from a string input (file).
 */

export class Lexer {
  private src = ""; // input
  private len = 0; // length of input
  private pos = 0; // current input position
  private token = ""; // current token
  private tokenRow = 0; // row of current token
  private tokenCol = 0; // col of current token
  private row = 1; // current row number of input
  private col = 1; // current column number of input
  private eof = false; // end of file / input

  private trsMode = false; // scanning of term rewriting system enabled?

  constructor(src: string) {
    this.src = src;
    this.len = src.length;
    this.next();
  }

  getToken(): string {
    return this.token;
  }

  getRow(): number {
    return this.tokenRow;
  }

  getCol(): number {
    return this.tokenCol;
  }

  isEof(): boolean {
    return this.eof;
  }

  activateTrsMode(on = true) {
    this.trsMode = on;
  }

  /**
   * gets the nest token into this.token (also updates this.pos, this.tokenRow, this.tokenCol, ...)
   * @returns
   */
  next() {
    // skip white spaces and comments
    let comment = false;
    let stop;
    for (;;) {
      stop = false;
      // end of input?
      if (this.pos >= this.len) {
        this.eof = true;
        return;
      }
      // read next character
      let ch = this.src[this.pos];
      switch (ch) {
        case " ":
          this.pos++, this.col++;
          break;
        case "\t":
          this.pos++, (this.col += 4);
          break;
        case "\n":
          this.pos++, this.row++, (this.col = 1);
          if (comment) {
            // comments end after line break
            comment = false;
          }
          break;
        case ";":
          this.pos++, this.col++;
          comment = true;
          break;
        default:
          if (comment) {
            this.pos++, this.col++;
          } else {
            stop = true;
          }
      }
      if (stop) break;
    }
    // set token position
    this.tokenCol = this.col;
    this.tokenRow = this.row;
    // read token
    this.token = "";
    let isString = false;
    for (;;) {
      // end of input?
      if (this.pos >= this.len) {
        if (this.token.length == 0) this.eof = true;
        return;
      }
      // read next character
      let ch = this.src[this.pos];
      // string?
      if (ch == '"') {
        // TODO: handle unclosed strings
        if (isString) {
          this.pos++, this.col++;
          this.token += ch;
          return;
        } else {
          if (this.token.length > 0) return;
          isString = true;
          this.pos++, this.col++;
          this.token += ch;
          continue;
        }
      }
      if (isString == false) {
        // stop in case of a white space or comment
        if (" \t\n;".includes(ch)) return;
        // special characters (e.g. parentheses) are returned as separate tokens
        if ("()[]'`,".includes(ch)) {
          // if applicable: return token before special character
          if (this.token.length > 0 && this.token !== "#") return;
          this.pos++, this.col++;
          this.token += ch;
          return;
        }
      }
      // append character to token
      this.pos++, this.col++;
      if (isString || this.token === "#\\" || this.trsMode) this.token += ch;
      else this.token += ch.toUpperCase();
    }
  }
}
