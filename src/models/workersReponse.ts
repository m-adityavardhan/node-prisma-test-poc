import { Worker } from "@prisma/client";

export interface WorkersResponse {
    data: Worker[];
    links: {
      next?: string; // URL for the next page, if available.
    };
}