import { Workplace } from "@prisma/client";

export interface WorkPlacesReponse {
    data: Workplace[];
    links: {
      next?: string; // URL for the next page, if available.
    };
  }