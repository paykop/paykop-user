import type { Config, DriveStep, Driver } from "driver.js";

export type TourId = "buyer_home" | "seller_hub" | "agent_hub";

export interface TourDefinition {
  id: TourId;
  title: string;
  config?: Omit<Config, "steps">;
  steps: DriveStep[];
}

export interface UseTourOptions {
  autoStart?: boolean;
  delayMs?: number;
  onComplete?: () => void;
}

export interface TourHookReturn {
  startTour: () => void;
  stopTour: () => void;
  isCompleted: boolean;
  isRunning: boolean;
  resetTour: () => void;
  driverInstance: Driver | null;
}
