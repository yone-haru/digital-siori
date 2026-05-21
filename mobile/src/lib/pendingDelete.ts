type PendingDelete = { bookId: string; bookTitle: string } | null;

let _state: PendingDelete = null;

export const pendingDelete = {
  set(v: PendingDelete) { _state = v; },
  get(): PendingDelete { return _state; },
  clear() { _state = null; },
};
