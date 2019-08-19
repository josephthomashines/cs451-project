import GameInstance from '../src/GameInstance';
import { Status } from '../../client/src/classes/Game';

test('creation of instance ID', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  expect(gi.instanceID).toBeTruthy();
});

test('copy of player ids', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  expect(gi.p1ID).toEqual(p1);
  expect(gi.p2ID).toEqual(p2);
});

test('default undefined board', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  expect(gi.board).toBeUndefined();
});

test('default GOOD status', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  expect(gi.status).toEqual(Status.GOOD);
});

test('can update board', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  let testBoard = 'This is a board';
  gi.updateBoard(testBoard);
  expect(gi.board).toEqual(testBoard);
});

test('can set the status', (): void => {
  let p1 = 'p1';
  let p2 = 'p2';
  let gi = new GameInstance(p1, p2);
  let testStatus = Status.QUEUE;
  gi.status = testStatus;
  expect(gi.status).toEqual(testStatus);
});

