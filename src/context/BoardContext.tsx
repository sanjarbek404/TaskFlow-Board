import React, { createContext, useContext, useReducer, ReactNode, useEffect } from "react";
import { Column, Task, Id } from "../types";
import { v4 as uuidv4 } from "uuid";

interface BoardState {
  columns: Column[];
  tasks: Task[];
}

type Action =
  | { type: "ADD_COLUMN"; payload: { title: string } }
  | { type: "DELETE_COLUMN"; payload: { id: Id } }
  | { type: "UPDATE_COLUMN"; payload: { id: Id; title: string } }
  | { type: "ADD_TASK"; payload: { columnId: Id; content: string } }
  | { type: "DELETE_TASK"; payload: { id: Id } }
  | { type: "UPDATE_TASK"; payload: { id: Id; content: string } }
  | { type: "MOVE_TASK"; payload: { id: Id; targetColumnId: Id } }
  | { type: "SET_STATE"; payload: BoardState };

const initialState: BoardState = {
  columns: [
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ],
  tasks: [
    { id: "1", columnId: "todo", content: "Learn React" },
    { id: "2", columnId: "todo", content: "Learn dnd-kit" },
    { id: "3", columnId: "in-progress", content: "Build a Trello Clone" },
    { id: "4", columnId: "done", content: "Set up project" },
  ],
};

function boardReducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case "ADD_COLUMN":
      return {
        ...state,
        columns: [...state.columns, { id: uuidv4(), title: action.payload.title }],
      };
    case "DELETE_COLUMN":
      return {
        ...state,
        columns: state.columns.filter((c) => c.id !== action.payload.id),
        tasks: state.tasks.filter((t) => t.columnId !== action.payload.id),
      };
    case "UPDATE_COLUMN":
      return {
        ...state,
        columns: state.columns.map((c) =>
          c.id === action.payload.id ? { ...c, title: action.payload.title } : c
        ),
      };
    case "ADD_TASK":
      return {
        ...state,
        tasks: [
          ...state.tasks,
          { id: uuidv4(), columnId: action.payload.columnId, content: action.payload.content },
        ],
      };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload.id),
      };
    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, content: action.payload.content } : t
        ),
      };
    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.payload.id ? { ...t, columnId: action.payload.targetColumnId } : t
        ),
      };
    case "SET_STATE":
      return action.payload;
    default:
      return state;
  }
}

const BoardContext = createContext<{
  state: BoardState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

const STORAGE_KEY = "taskflow-board-state";

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, initialState, (initial) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Failed to load state from local storage", e);
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to local storage", e);
    }
  }, [state]);

  return (
    <BoardContext.Provider value={{ state, dispatch }}>
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within a BoardProvider");
  }
  return context;
}
