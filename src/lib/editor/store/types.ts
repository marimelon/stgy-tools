/**
 * TanStack Store type definitions
 */

import type { Store } from "@tanstack/store";
import type { EditorState } from "../types";

export type EditorStore = Store<EditorState>;

export interface EditorStoreOptions {
	initialState: EditorState;
}
