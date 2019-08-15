import Board  from '../classes/Board';
import {Coordinates, coordinatesToIndex, PieceColor} from "../classes/Game";
import Piece from "../classes/Piece";


const capturePositions = `-r-r-r-r
                          r-r-r---
                          -w------
                          ------w-
                          -w------
                          ----r--w
                          -w-w-w-w
                          --------`.replace(/(\n|\t|\s)/g, '').split('');

const SingleRedCapturePositions = `-r-r-r-r
                               r-r-r---
                               --------
                               --w---w-
                               -w------
                               ----r--w
                               -w-w---w
                               ------w-`.replace(/(\n|\t|\s)/g, '').split('');

const SingleWhiteCapturePositions =`---r-r-r
                                    r-r---r-
                                    ---w----
                                    ----r---
                                    -r------
                                    --------
                                    -w---w-w
                                    w-w-w-w-`.replace(/(\n|\t|\s)/g, '').split('');

const originalPositions = `-r-r-r-r
                           r-r-r-r-
                           --------
                           --------
                           --------
                           --------
                           -w-w-w-w
                           w-w-w-w-`.replace(/(\n|\t|\s)/g, '').split('');

const kingCapturePositions = `-/r/-/r/-/r/-/r/
                              r/-/r/-/-/-/-/-/
                              -/w/-/-/-/-/-/-/
                              -/-/-/-/-/-/w/-/
                              -/w/-/-/-/-/-/-/
                              -/-/-/-/r/-/-/w/
                              -/w/-/w/-/w/-/w/
                              -/-/r!/-/-/-/-/-`.replace(/(\n|\t|\s)/g, '').split('/');

const kingMovePositions = `-/r/-/r/-/r/-/r/
                           r/-/r/-/-/-/-/-/
                           -/-/-/-/-/-/-/-/
                           -/-/w/-/-/-/w/-/
                           -/w/-/-/-/-/-/-/
                           w/-/-/-/r/-/-/w/
                           -/-/-/-/-/-/-/w/
                           -/-/r!/-/w/-/w/-`.replace(/(\n|\t|\s)/g, '').split('/');



const SingleRedCaptureBoard = new Board(SingleRedCapturePositions.reverse());
const SingleWhiteCaptureBoard = new Board(SingleWhiteCapturePositions.reverse());
const captureBoard = new Board(capturePositions.reverse());
const originalBoard = new Board(originalPositions.reverse());
const staticBoard = new Board(originalPositions.reverse());
const kingCaptureBoard = new Board(kingCapturePositions.reverse());
const kingMoveBoard = new Board(kingMovePositions.reverse());


test('serializeToArray', () => {
    expect(staticBoard.serializeToArray()).toEqual(originalPositions);
    expect(kingCaptureBoard.serializeToArray()).toEqual(kingCapturePositions);
});


test('getValidMoves', () => {
    //checks a piece with two captures
    expect(captureBoard.getValidMoves([3,2],false)).toEqual([[1,0],[5,0]]);

    //checks a piece with one capture and continues
    expect(captureBoard.getValidMoves([5,6],false)).toEqual([[7,4]]);

    //checks if a piece can be moved when a capture is present;
    expect(captureBoard.getValidMoves([3,6],false)).toEqual([[2, 5], [4, 5]]);

    //normal board movement
    expect(originalBoard.getValidMoves([1,6],false)).toEqual([[0,5],[2,5]]);

    //trying to move a select a square without a piece
    expect(() => originalBoard.getValidMoves([8,4],false))
        .toThrowError(new Error('Invalid piece coordinates.'));

    //trying to move a select a square without a piece
    expect(() => originalBoard.getValidMoves([4,4],false))
        .toThrowError(new Error('Tried to get valid moves on a square that has no piece.'))

});

//TODO incomplete was working on a mock for this
test('computeAllValidMoves', () => {
    //Checks all valid moves for red piece with captures
    expect(captureBoard.computeAllValidMoves(PieceColor.RED));

    //Checks all valid moves for White piece with captures
    expect(captureBoard.computeAllValidMoves(PieceColor.WHITE));

    //Checks all valid moves for a board without captures
    expect(originalBoard.computeAllValidMoves(PieceColor.WHITE));

});

test('computeAllValidMoves SingleRedCapture', async () => {
    async function fetchData() {
        await SingleRedCaptureBoard.computeAllValidMoves(PieceColor.RED);
        // @ts-ignore
        return SingleRedCaptureBoard._validMovesCache;
    }
    const data = await fetchData();
    expect(data.values().next().value.toString()).toBe('5,0');
});

//TODO something weird here it captures backwards?
test('computeAllValidMoves WhiteRedCapture', async () => {
    async function fetchData() {
        await SingleWhiteCaptureBoard.computeAllValidMoves(PieceColor.WHITE);
        // @ts-ignore
        return SingleWhiteCaptureBoard._validMovesCache;
    }
    const data = await fetchData();
    expect(data.values().next().value.toString()).toBe('2,3');
});

//TODO fill out last test
// test('computeAllValidMoves ', async () => {
//     async function fetchData() {
//         await SingleRedCaptureBoard.computeAllValidMoves(PieceColor.RED);
//         return SingleRedCaptureBoard._validMovesCache;
//     }
//     const data = await fetchData();
//     expect(data.values().next().value.toString()).toBe('5,0');
// });

test('movePieceToPosition', () => {

    //moving red pieces
    //testing a moving to an occupied square
    expect(() => originalBoard.movePieceToPosition([0,7], [1,6]))
        .toThrowError(new Error('Tried to move to an occupied square'));

    //testing a invalid capture outside range
    expect(() => captureBoard.movePieceToPosition([7,6], [4,3]))
        .toThrowError(new Error(`Invalid capture move - move is outside of capture range.`));

    //testing a invalid capture no square to be captured
    expect(() => captureBoard.movePieceToPosition([3,6], [5,4]))
        .toThrowError(new Error('Invalid capture move - no piece on square to capture.'));

    //testing a invalid capture tried to capture own piece
    expect(() => captureBoard.movePieceToPosition([2,7], [4,5]))
        .toThrowError(new Error('Tried to capture own color piece.'));

    //testing a invalid origin
    expect(() => captureBoard.movePieceToPosition([8,2], [4,0]))
        .toThrowError(new Error('Invalid piece coordinates.'));

    //testing a invalid destination
    expect(() => captureBoard.movePieceToPosition([3,2], [8,0]))
        .toThrowError(new Error('Invalid piece coordinates.'));

    //testing a empty origin piece
    expect(() => captureBoard.movePieceToPosition([4,4], [4,0]))
        .toThrowError(new Error('Tried to move a non-existent piece.'));

    //testing a red capture white move
    expect(captureBoard.movePieceToPosition([3,2], [1,0])).toBeTruthy();

    //TODO testing a white capture red move, will test later
    //expect(captureBoard.movePieceToPosition([3,2], [1,0])).toBeTruthy();

    //testing a regular move
    expect(originalBoard.movePieceToPosition([1,6], [0,5])).toBeFalsy();

    //testing a regular king capture
    expect(kingCaptureBoard.movePieceToPosition([5,0], [7,2])).toBeTruthy();

    ////testing a mutli king valid moves
    expect(kingCaptureBoard.getValidMoves([7,2],true)).toEqual([[5,4]]);

    //testing a mutli king capture
    expect(kingCaptureBoard.movePieceToPosition([7,2], [5,4])).toBeTruthy();

    //testing a regular king move
    expect(kingMoveBoard.movePieceToPosition([5,0], [6,1])).toBeFalsy();

});