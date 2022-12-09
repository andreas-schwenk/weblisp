/* webLISP, 2022 by Andreas Schwenk */

export class Lexer {
  private src = "";
  private len = 0; // length of input
  private pos = 0; // current input position
  private token = ""; // current token
  private tokenRow = 0; // row of current token
  private tokenCol = 0; // col of current token
  private row = 1; // current row number of input
  private col = 1; // current column number of input
  private eof = false; // end of file / input

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

  next() {
    // skip white spaces and comments
    let comment = false;
    let stop = false;
    for (;;) {
      stop = false;
      if (this.pos >= this.len) {
        this.eof = true;
        return;
      }
      let ch = this.src[this.pos];
      switch (ch) {
        case " ":
        case "\t":
          this.pos++, (this.col += ch == "\t" ? 4 : 1);
          break;
        case "\n":
          this.pos++, this.row++, (this.col = 1);
          if (comment) comment = false;
          break;
        case ";":
          this.pos++, this.col++;
          comment = true;
          break;
        default:
          if (comment) {
            this.pos++, this.col++;
          } else stop = true;
      }
      if (stop) break;
    }
    // set token position
    this.tokenCol = this.col;
    this.tokenRow = this.row;
    // ID | INT | REAL | DEL
    this.token = "";
    for (;;) {
      if (this.pos >= this.len) {
        if (this.token.length == 0) this.eof = true;
        return;
      }
      let ch = this.src[this.pos];
      if (ch == " " || ch == "\t" || ch == "\n" || ch == ";") {
        return;
      }
      if (ch == "(" || ch == ")" || ch == "'") {
        if (this.token.length > 0) return;
        this.pos++;
        this.col++;
        this.token = ch;
        return;
      }
      this.pos++;
      this.col++;
      this.token += ch.toUpperCase();
    }
  }
}
