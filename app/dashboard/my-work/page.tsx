// My Work. The screen owns its own switch, toolbar and dialogs; the shell header carries
// the title and subtitle (see shell-nav PAGE_META).
//
// Suspense is required, not decorative: MyWorkScreen reads `?view=` with useSearchParams so
// the Overview modules can drill straight into one view, and Next refuses to build a
// statically rendered page that reads search params outside a boundary.
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
