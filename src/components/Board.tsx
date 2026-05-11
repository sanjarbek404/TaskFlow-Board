import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ColumnContainer } from "./ColumnContainer";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { TaskCard } from "./TaskCard";
import { useBoard } from "../context/BoardContext";
import { Column, Task } from "../types";

export function Board() {
  const { state, dispatch } = useBoard();
  const { columns, tasks } = state;

  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px] bg-slate-950">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
      >
        <div className="m-auto flex gap-4">
          <div className="flex gap-4">
            <SortableContext items={columnsId}>
              {columns.map((col) => (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  tasks={tasks.filter((task) => task.columnId === col.id)}
                />
              ))}
            </SortableContext>
          </div>
          <button
            onClick={() => dispatch({ type: "ADD_COLUMN", payload: { title: "New Column" } })}
            className="
              h-[60px]
              w-[350px]
              min-w-[350px]
              cursor-pointer
              rounded-xl
              bg-slate-900
              border-2
              border-slate-800
              p-4
              ring-rose-500
              hover:ring-2
              flex
              gap-2
              items-center
              text-white
            "
          >
            <Plus size={20} />
            Add Column
          </button>
        </div>

        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                tasks={tasks.filter((task) => task.columnId === activeColumn.id)}
              />
            )}
            {activeTask && <TaskCard task={activeTask} />}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    if (event.active.data.current?.type === "Column") {
      setActiveColumn(event.active.data.current.column);
      return;
    }

    if (event.active.data.current?.type === "Task") {
      setActiveTask(event.active.data.current.task);
      return;
    }
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === "Column";
    if (!isActiveAColumn) return;

    // Handle Column sorting
    const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
    const overColumnIndex = columns.findIndex((col) => col.id === overId);

    const newColumns = arrayMove(columns, activeColumnIndex, overColumnIndex);
    dispatch({ type: "SET_STATE", payload: { ...state, columns: newColumns } });
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === "Task";
    const isOverATask = over.data.current?.type === "Task";
    const isOverAColumn = over.data.current?.type === "Column";

    if (!isActiveATask) return;

    // Scenario 1: Dropping a Task over another Task
    if (isActiveATask && isOverATask) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const overIndex = tasks.findIndex((t) => t.id === overId);

      const activeTask = tasks[activeIndex];
      const overTask = tasks[overIndex];

      if (activeTask.columnId !== overTask.columnId) {
        // Task is moving to a different column
        activeTask.columnId = overTask.columnId;
      }
      
      const newTasks = arrayMove(tasks, activeIndex, overIndex);
      dispatch({ type: "SET_STATE", payload: { ...state, tasks: newTasks } });
    }

    // Scenario 2: Dropping a Task over an empty Column
    if (isActiveATask && isOverAColumn) {
      const activeIndex = tasks.findIndex((t) => t.id === activeId);
      const activeTask = tasks[activeIndex];
      
      // We only want to update if changing columns
      if (activeTask.columnId !== overId) {
        activeTask.columnId = overId;
        const newTasks = arrayMove(tasks, activeIndex, activeIndex);
        dispatch({ type: "SET_STATE", payload: { ...state, tasks: newTasks } });
      }
    }
  }
}
