// One task, on its own route, so a task can be linked to and opened directly.
//
// The record lives in the browser-local demo store, so resolution — including "no such
// task" — happens client-side. notFound() here would 404 on a task that exists in the
// visitor's store, which is why the view renders a not-found STATE instead.
import { TaskPageView } from "./task-page-view";

export const metadata = { title: "Task — Command Center" };

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  return <TaskPageView taskId={taskId} />;
}
