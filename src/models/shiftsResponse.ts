import { Shift } from "@prisma/client";

export interface ShiftsResponse {
    data: Shift[];
    links: {
      next?: string; // URL for the next page, if available.
    };
  }