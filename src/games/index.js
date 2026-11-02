import snake from './snake.js';
import g2048 from './g2048.js';
import memory from './memory.js';
import whack from './whack.js';
import math from './math.js';
import hopper from './hopper.js';
import tictactoe from './tictactoe.js';
import bricks from './bricks.js';
import sequence from './sequence.js';
import mines, { expertMines } from './mines.js';
import wordguess from './wordguess.js';
import shooter from './shooter.js';
import stack from './stack.js';
import reaction from './reaction.js';
import carrace from './carrace.js';
import bikerace from './bikerace.js';
import targets from './targets.js';
import balloons from './balloons.js';
import shapes from './shapes.js';
import counting from './counting.js';
import sudoku, { expertSudoku } from './sudoku.js';
import connect4 from './connect4.js';
import typing from './typing.js';
import reversi from './reversi.js';
import codebreaker from './codebreaker.js';
import slider from './slider.js';

export const games = [
  snake, g2048, memory, whack, math, hopper, tictactoe, bricks, sequence,
  mines, wordguess, shooter, stack, reaction, carrace, bikerace, targets,
  balloons, shapes, counting, sudoku, connect4, typing,
  reversi, codebreaker, slider, expertSudoku, expertMines,
];

export const AGES = [
  { id: 'child', title: 'Child', note: 'Easy, colourful games for younger players' },
  { id: 'junior', title: 'Junior', note: 'Tougher games for older kids, teens and adults' },
  { id: 'senior', title: 'Senior', note: 'The hardest games, for experienced players' },
];

export const ageName = (id) => AGES.find((a) => a.id === id).title;

export function getGame(id) {
  return games.find((g) => g.id === id);
}
