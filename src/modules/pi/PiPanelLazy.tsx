import { lazy, Suspense, type ComponentProps } from "react";
import { PaneLoadingFallback } from "@/components/PaneLoadingFallback";
import type { PiPanel } from "./PiPanel";

type PiPanelProps = ComponentProps<typeof PiPanel>;

const LazyPiPanel = lazy(async () => {
  const [{ PiControllerProvider }, { PiPanel }] = await Promise.all([
    import("./lib/PiControllerProvider"),
    import("./PiPanel"),
  ]);

  return {
    default: function PiPanelRoot(props: PiPanelProps) {
      return (
        <PiControllerProvider>
          <PiPanel {...props} />
        </PiControllerProvider>
      );
    },
  };
});

export function PiPanelLazy(props: PiPanelProps) {
  return (
    <Suspense fallback={<PaneLoadingFallback label="Loading Code" />}>
      <LazyPiPanel {...props} />
    </Suspense>
  );
}
