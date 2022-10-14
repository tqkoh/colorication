import { airSquare as a, GameMap, Square, startSquare as s } from '../gamemap';
import mapWorld0 from './worlds/world0';

const wo0: Square = {
  Atype: 'map',
  map: new GameMap(mapWorld0),
  name: '0. welcome',
  movable: false,
  collidable: true,
  locked: false
};

const mapRoot: Square[][] = [
  [s(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), wo0, a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()],
  [a(), a(), a(), a(), a(), a(), a(), a(), a(), a(), a()]
];

export default mapRoot;
