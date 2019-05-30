import { find, partial } from 'lodash';
import { TaskTile, Tile, TileType } from '../interfaces';
import { StreamDiagramComponent } from './stream-diagram.component';

const ID_FIRST_ROW = '::FIRST_ROW';
export function trackRow(context: StreamDiagramComponent, index, row: Tile[]) {
  const isFirstRenderedRow = () => index === context.tileMatrix.length - 1;
  if (!context.tileMatrix || context.tileMatrix.length === 0 || isFirstRenderedRow()) {
    return ID_FIRST_ROW;
  }
  const firstTask = <TaskTile>find(row, tile => tile.type === TileType.Task);
  if (firstTask) {
    return firstTask.task.id;
  } else {
    return index;
  }
}

export function streamDiagramRowTracker(context: StreamDiagramComponent) {
  return partial(trackRow, context);
}
