// My Work. The screen owns its own switch, toolbar and dialogs; the shell header carries
// the title and subtitle (see shell-nav PAGE_META).
//
// The boundary covers the first client render: MyWorkScreen reads `?view=` and the rest of its
// filter state from the address bar, which no server render can know, so the fallback is what
// the page shows for the moment before hydration decides which view was asked for.
import { Suspense } from "react";
import { MyWorkScreen } from "./my-work-view";
import { RouteLoading } from "../../../components/demo/route-states";

export const metadata = { title: "My Work — Command Center" };

export default function MyWorkPage() {
  return (
    <Suspense fallback={<RouteLoading label="your work" />}>
      <MyWorkScreen />
    </Suspense>
  );
}
