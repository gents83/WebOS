export interface FileSystemItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'shortcut';
  size?: string;
  modified?: string;
  children?: FileSystemItem[]; // Used for capturing state for undo
  targetPath?: string; // For shortcuts
  content?: string; // For file content
}

export interface SearchResultItem extends FileSystemItem {
  path: string;
}

// --- Undo Action Types ---
export interface MoveAction {
  type: 'move';
  item: FileSystemItem;
  sourcePath: string;
  destPath: string;
}

export interface DeleteAction {
  type: 'delete';
  item: FileSystemItem; // A full deep copy of the item and its children
  parentPath: string;
}

export interface CreateAction {
  type: 'create';
  item: FileSystemItem;
  parentPath: string;
}

export interface RenameAction {
  type: 'rename';
  itemId: string;
  oldName: string;
  newName: string;
  path: string;
}

export type UndoableAction = MoveAction | DeleteAction | CreateAction | RenameAction;
