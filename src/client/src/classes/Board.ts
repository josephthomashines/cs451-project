import Square from './Square';
import Piece from "./Piece";
import { PieceColor, SquareColor, indexToCoordinates, 
  coordinatesToIndex, Coordinates } from './Game';

class Board {
  private _squares: Square[];
  private _pieces: Piece[];
  private _redPieces: Piece[];
  private _whitePieces: Piece[];
  private _kings: Piece[];
  private _capturedReds: Piece[];
  private _capturedWhites: Piece[];
  private _validMovesCache: Map<Piece, Coordinates[]>;
  private _computedMoves: boolean;

  constructor(initialValues: string[]) {
    if(initialValues.length < 64) {
      throw new Error('The board must be provided with at least 64 initial values.');
    }

    initialValues.forEach((val) => {
      if(val.length !== 1 && val.length !== 2) {
        throw new Error('Each initial value must be of length 1 or 2.');
      }
    });

    this._squares = [];
    this._pieces = [];
    this._redPieces = [];
    this._whitePieces = [];
    this._kings = [];
    this._capturedReds = [];
    this._capturedWhites = [];
    this._validMovesCache = new Map<Piece, Coordinates[]>();
    this._computedMoves = false;

    const activeValues = initialValues.slice(0, 64);
    activeValues.forEach((val, i) => {
      const [x, y] = indexToCoordinates(i);
      const squareColor = (x + y) % 2 === 1 ? SquareColor.GREEN : SquareColor.YELLOW; 
      let color: PieceColor | null = null;
      let piece: Piece | null = null;
      
      const square = new Square(i, squareColor);
      if(val.charAt(0) !== '-') {
        color = val.charAt(0) === 'r' ? PieceColor.RED : PieceColor.WHITE;
        const isKing = val.length > 1 && val.charAt(1) === '!';
        piece = new Piece(color, i, isKing);
        square.piece = piece;
        this._pieces.push(piece);
        if(piece.isKing) this._kings.push(piece);
        color === PieceColor.RED ? this._redPieces.push(piece) : this._whitePieces.push(piece);
      }

      this._squares.push(square);
    });

    if(initialValues.length > 64) {
      const captures = initialValues.slice(64);
      captures.forEach((val) => {
        if(val === 'r*') {
          const piece = new Piece(PieceColor.RED, null);
          this._capturedReds.push(piece);
        } else if(val === 'w*') {
          const piece = new Piece(PieceColor.WHITE, null);
          this._capturedWhites.push(piece);
        } else {
          throw new Error('Invalid serialization format.');
        }
      });
    }

    if(this._capturedReds.length + this._redPieces.length !== 8 || 
      this._capturedWhites.length + this._whitePieces.length !== 8) {
        throw new Error('Invalid initial values. There must be 8 white and red pieces.');
    }
  }
  
  get squares() : Square[] {
    return this._squares;
  }

  get pieces() : Piece[] {
    return this._pieces;
  }

  get redPieces() : Piece[] {
    return this._redPieces;
  }

  get whitePieces() : Piece[] {
    return this._whitePieces;
  }

  get kings() : Piece[] {
    return this._kings;
  }

  get capturedReds() : Piece[] {
    return this._capturedReds;
  }

  get capturedWhites() : Piece[] {
    return this._capturedWhites;
  }

  private areValidCoordinates(coords: Coordinates) : boolean {
    return !coords.some((val) => val < 0 || val > 7);
  }

  private areCoordinatesOccupied(coords: Coordinates) : boolean {
    return this._pieces.some((p) => {
      return p.coordinates !== null && 
      p.coordinates[0] === coords[0] && 
      p.coordinates[1] === coords[1];
    });
  }

  private areCoordinatesOccupiedByEnemy(color: PieceColor, coords: Coordinates) : boolean {
    return this._pieces.some((p) => {
      return p.coordinates !== null && 
      p.coordinates[0] === coords[0] && 
      p.coordinates[1] === coords[1] &&
      p.color !== color;
    });
  }

  private findCaptures(piece: Piece, validDiffs: Coordinates[]) : Coordinates[] {
    const validCaptures : Coordinates[] = [];
    const uncheckedDiffs : Coordinates[] = [...validDiffs];
    const { coordinates, color } = piece;
    validDiffs.forEach((val, i) => {
      let possible: Coordinates = [val[0] + coordinates![0], val[1] + coordinates![1]];
      // Out of bounds
      if(!this.areValidCoordinates(possible)) {
        return;
      }

      if(this.areCoordinatesOccupiedByEnemy(color, possible)) {
        // Check spot to be jumped to
        possible = [possible[0] + val[0], possible[1] + val[1]];
        if(!this.areValidCoordinates(possible) || this.areCoordinatesOccupied(possible)) {
          return;
        }
        validCaptures.push(possible);
        uncheckedDiffs.splice(i, 1);
      }
    });

    return validCaptures;
  }

  private _getValidMoves(piece: Piece, hasCaptured: boolean) : Coordinates[] {
    // We only use the cache if it is not a chained move
    if(this._computedMoves && !hasCaptured) {
      return this._validMovesCache.get(piece) || []; // I blame flow analysis in maps for this one <.<
    }

    const validDiffs: Coordinates[] = [[-1, -1], [1, -1]];
    if (piece.isKing) {
      validDiffs.push([-1, 1], [1, 1]);
    }
    const validCaptures = this.findCaptures(piece, validDiffs);
    
    // If a capture is possible the piece MUST take it - so only show captures
    if(validCaptures.length > 0 || hasCaptured) {
      return validCaptures;
    }

    // Now we look for normie moves
    const validMoves : Coordinates[] = [];
    const { coordinates } = piece; 
    validDiffs.forEach((val) => {
      let possible: Coordinates = [val[0] + coordinates![0], val[1] + coordinates![1]];
        // Out of bounds
      if(!this.areValidCoordinates(possible)) {
        return;
      }

      if(!this.areCoordinatesOccupied(possible)) {
        validMoves.push(possible);
      }
    });

    return validMoves;
  }
 
  public getValidMoves(piecePosition: Coordinates, hasCaptured: boolean) : Coordinates[] {
    if (!this.areValidCoordinates(piecePosition)) {
      throw new Error('Invalid piece coordinates.');
    }

    const index = coordinatesToIndex(piecePosition);
    const piece = this._squares[index].piece;
    if(piece === null) {
      throw new Error('Tried to get valid moves on a square that has no piece.');
    }
    return this._getValidMoves(piece, hasCaptured);
  }

  /**
   * Return true if the move generated a capture since the UI has to know whether to continue 
   * the player's turn
   */
  private _movePieceToPosition(piece: Piece, newPosition: Coordinates) : boolean {
    const { coordinates } = piece;
    const [x1, y1] = coordinates!;
    const [x2, y2] = newPosition;
    let captured = false;
    // Simple move, only check if a piece is there
    if(Math.abs(x1 - x2) === 1) {
      if(this.areCoordinatesOccupied(newPosition)) {
        throw new Error('Tried to move to an occupied square');
      }
    } 
    // Capture logic
    else {
      const direction: Coordinates = [(x1 - x2)/2, (y1 - y2)/2];
      if(direction.some((x) => Math.abs(x) !== 1)) {
        throw new Error(`Invalid capture move - move is outside of capture range.`);
      }

      const captureCoords : Coordinates = [x1 - direction[0], y1 - direction[1]];
      const captureSquare = this._squares[coordinatesToIndex(captureCoords)];
      if(captureSquare.piece === null) {
        throw new Error('Invalid capture move - no piece on square to capture.');
      }
      
      const capturePiece = captureSquare.piece;
      if(capturePiece.color === piece.color) {
        throw new Error('Tried to capture own color piece.');
      }

      switch (piece.color) {
        case PieceColor.RED: this._capturedWhites.push(capturePiece);
        break;
        case PieceColor.WHITE: this._capturedReds.push(capturePiece);
        break;
      }

      captureSquare.piece.coordinates = null;
      captureSquare.piece = null;
      captured = true;
    }

    const oldSquare = this._squares[coordinatesToIndex(coordinates!)];
    const newSquare = this._squares[coordinatesToIndex(newPosition)];
    oldSquare.piece = null;
    newSquare.piece = piece;
    piece.coordinates = newPosition;
    if(newPosition[1] === 0) {
      piece.setAsKing();
    }

    // Turn is over; reset the cache
    if(!captured) {
      this._validMovesCache.clear();
    }
    return captured;
  }

  private async _computeAllValidMoves(pieces: Piece[]): Promise<undefined> {
    let captureFound = false;

    // First pass - look for captures only
    pieces.forEach((piece) => {
      if(piece.coordinates === null) {
        return;
      }
      if(captureFound) {
        this._validMovesCache.set(piece, this._getValidMoves(piece, true));
        return;
      }
      const captures = this._getValidMoves(piece, true);
      if(captures.length > 0) {
        captureFound = true;
      }
      this._validMovesCache.set(piece, captures);
    });

    // Second pass - we found none so we just fill in valid moves
    if(!captureFound) {
      pieces.forEach((piece) => {
        if(piece.coordinates === null) {
          return;
        }
        this._validMovesCache.set(piece, this._getValidMoves(piece, false));
      });
    }

    this._computedMoves = true;
    return;
  }

  public async computeAllValidMoves(color: PieceColor): Promise<undefined> {
    if(color === PieceColor.RED) {
      return this._computeAllValidMoves(this._redPieces);
    }
    else if(color === PieceColor.WHITE) {
      return this._computeAllValidMoves(this._whitePieces);
    }
    return;
  }

  public movePieceToPosition(piecePosition: Coordinates, newPosition: Coordinates): boolean {
    if(!this.areValidCoordinates(piecePosition) || !this.areValidCoordinates(newPosition)) {
      throw new Error('Invalid piece coordinates.');
    }

    const index = coordinatesToIndex(piecePosition);
    const piece = this._squares[index].piece;
    if(piece === null) {
      throw new Error('Tried to move a non-existent piece.');
    }
    
    return this._movePieceToPosition(piece, newPosition);
  }

  public getGameWinner(): PieceColor | null {
    if(this._capturedReds.length === 8) {
      return PieceColor.WHITE;
    } else if (this._capturedWhites.length === 8) {
      return PieceColor.RED;
    } else {
      return null;
    }
  }

  /**
   * Did not put much thought into it but basically it returns an array
   * with 64 + x strings where x is the number of captured pieces
   * red captured pieces are serialized first, then white
   * we use this as history, and also to send to the server to send to the other client
   * the constructor was modified to accept this as the only valid serialization
   */
  public serializeToArray() : string[] {
    const serialized = this._squares.map((square) => {
      const piece = square.piece;
      if(piece === null) {
        return '-';
      }
      let val = '';
      switch(piece.color) {
        case PieceColor.RED: val = 'r';
        break;
        case PieceColor.WHITE: val = 'w';
        break;
      }
      if(piece.isKing) {
        val = val.concat('!');
      }
      return val;
    });

    if(this._capturedReds.length > 0) {
      serialized.push(...(this._capturedReds.map(() => 'r*')));
    }

    if(this._capturedWhites.length > 0) {
      serialized.push(...(this._capturedWhites.map(() => 'w*')));
    }
    return serialized;
  }
}

export default Board;
