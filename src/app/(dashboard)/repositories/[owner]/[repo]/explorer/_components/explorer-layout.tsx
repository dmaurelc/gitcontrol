"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

type Props = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export function ExplorerLayout({ left, center, right }: Props) {
  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="hidden h-[calc(100vh-12rem)] min-h-[500px] rounded-md border md:flex"
    >
      <ResizablePanel defaultSize={22} minSize={16} maxSize={35}>
        <div className="flex h-full flex-col overflow-hidden">{left}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={38} minSize={25}>
        <div className="flex h-full flex-col overflow-hidden">{center}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={40} minSize={25}>
        <div className="flex h-full flex-col overflow-hidden">{right}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function ExplorerMobileFallback() {
  return (
    <div className="rounded-md border border-dashed bg-card/30 p-6 text-center text-sm text-muted-foreground md:hidden">
      <p className="font-medium text-foreground">
        Explorer view requires a larger screen.
      </p>
      <p className="mt-1">
        Switch back to Tabs view or open this repo on a desktop browser.
      </p>
    </div>
  );
}
