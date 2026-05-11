import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useMemo, useState } from "react";
import { Column, Id, Task } from "../types";
import { TaskCard } from "./TaskCard";
import { Plus, Trash2 } from "lucide-react";
import { useBoard } from "../context/BoardContext";

interface Props {
  key?: React.Key;
  column: Column;
  tasks: Task[];
}

export function ColumnContainer({ column, tasks }: Props) {
  const [editMode, setEditMode] = useState(false);
  const { dispatch } = useBoard();

  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
    disabled: editMode,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="
          bg-slate-900
          opacity-40
          border-2
          border-rose-500
          w-[350px]
          h-[500px]
          max-h-[500px]
          rounded-md
          flex
          flex-col
        "
      ></div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="
        bg-slate-900
        w-[350px]
        h-[500px]
        max-h-[500px]
        rounded-xl
        flex
        flex-col
      "
    >
      {/* Column title */}
      <div
        {...attributes}
        {...listeners}
        onClick={() => setEditMode(true)}
        className="
          bg-slate-800
          text-md
          h-[60px]
          cursor-grab
          rounded-t-xl
          p-4
          font-bold
          border-b-2
          border-slate-950
          flex
          items-center
          justify-between
          text-white
        "
      >
        <div className="flex gap-2">
          <div className="flex justify-center items-center bg-slate-900 px-2 py-1 text-sm rounded-full">
            {tasks.length}
          </div>
          {!editMode && column.title}
          {editMode && (
            <input
              className="bg-transparent focus:outline-none border-none rounded px-1 -mx-1"
              value={column.title}
              onChange={(e) => dispatch({ type: "UPDATE_COLUMN", payload: { id: column.id, title: e.target.value } })}
              autoFocus
              onBlur={() => setEditMode(false)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                setEditMode(false);
              }}
            />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: "DELETE_COLUMN", payload: { id: column.id } });
          }}
          className="stroke-gray-500 hover:stroke-white hover:bg-slate-700 rounded px-1 py-2"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Column task container */}
      <div className="flex flex-grow flex-col gap-4 p-4 overflow-x-hidden overflow-y-auto">
        <SortableContext items={tasksIds}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
      </div>

      {/* Column footer */}
      <button
        className="flex gap-2 items-center border-slate-900 border-2 rounded-b-xl p-4 border-x-slate-900 hover:bg-slate-800 hover:text-rose-500 active:bg-slate-950 transition-colors text-white"
        onClick={() => dispatch({ type: "ADD_TASK", payload: { columnId: column.id, content: "New task" } })}
      >
        <Plus size={20} />
        Add task
      </button>
    </div>
  );
}
