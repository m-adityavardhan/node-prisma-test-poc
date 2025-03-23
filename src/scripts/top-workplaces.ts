import axios, { AxiosResponse } from 'axios';
import { Workplace, Shift, Worker } from '@prisma/client'; 
import { WorkPlacesReponse } from 'src/models/workPlacesResponse';
import { ShiftsResponse } from 'src/models/shiftsResponse';
import { WorkersResponse } from 'src/models/workersReponse';
import { FinalResponse } from 'src/models/finalResponse';

const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

async function getWorkplaces(): Promise<Workplace[]>{
    let workPlaces:Workplace[] = [];
    let nextUrl: string | undefined = `${baseUrl}/workplaces`;
  
    while (nextUrl) {
      const response:AxiosResponse<WorkPlacesReponse> = await axios.get<WorkPlacesReponse>(nextUrl);
      const data = response.data;
      workPlaces = workPlaces.concat(data.data);
      nextUrl = data.links.next;
    }
    return workPlaces;
}

async function getShifts(): Promise<Shift[]> {
    let shifts:Shift[] = [];
    let nextUrl: string | undefined = `${baseUrl}/shifts`;
  
    while (nextUrl) {
      const response:AxiosResponse<ShiftsResponse> = await axios.get<ShiftsResponse>(nextUrl);
      const data = response.data;
      shifts = shifts.concat(data.data);
      nextUrl = data.links.next;
    }
    return shifts;
}

async function getWorkers(): Promise<Worker[]> {
    let workers:Worker[] = [];
    let nextUrl: string | undefined = `${baseUrl}/workers`;
  
    while (nextUrl) {
      const response:AxiosResponse<WorkersResponse> = await axios.get<WorkersResponse>(nextUrl);
      const data = response.data;
      workers = workers.concat(data.data);
      nextUrl = data.links.next;
    }
    return workers;
}

/**
 * Determines if shift is valid and completed
 * @param shift 
 * @param activeWorkerIds 
 * @param activeWorkplacesIds 
 * @returns 
 */
function isCompletedShift(shift: Shift, activeWorkerIds: Set<number>,activeWorkplacesIds: Set<number>): boolean {
    return (
      shift.workerId !== null &&
      shift.cancelledAt === null &&
      activeWorkerIds.has(shift.workerId) &&
      activeWorkplacesIds.has(shift.workplaceId)
    );
}

/**
 * Calculated the top 3 active workplaces based on completed shifts count
 * @returns 
 */
async function getTopWorkplaces(): Promise<FinalResponse[]>{
    try {
        const workplaces = await getWorkplaces();
        const activeWorkplaces = workplaces.filter((workplace:Workplace) => workplace.status == 0);
        const activeWorkplacesIds = new Set<number>(activeWorkplaces.map((workplace:Workplace) => workplace.id));

        const shifts = await getShifts();

        const workers = await getWorkers();
        const activeWorkers = workers.filter((worker:Worker) => worker.status === 0);
        const activeWorkerIds = new Set<number>(activeWorkers.map((worker:Worker) => worker.id));

        const completedShifts = shifts.filter((shift:Shift) =>
        isCompletedShift(shift, activeWorkerIds,activeWorkplacesIds)
        );

        const workplaceShiftCount: Record<number, number> = {};
        for (const shift of completedShifts) {
        workplaceShiftCount[shift.workplaceId] =
            (workplaceShiftCount[shift.workplaceId] || 0) + 1;
        }

        const workplacesNameWithCount:FinalResponse[] = activeWorkplaces.map((workplace:Workplace) => ({
        name : workplace.name,
        shifts: workplaceShiftCount[workplace.id] || 0,
        }));

        workplacesNameWithCount.sort((a:any, b:any) => b.shifts - a.shifts);

        return workplacesNameWithCount.slice(0, 3);
    } catch (error) {
      console.error('Error fetching top workplaces:', error);
      throw error;
    }
}

(async () => {
    try {
      let topWorkplaces = await getTopWorkplaces();
      console.log('Top 3 Active Workplaces by Completed Shifts:', topWorkplaces);
    } catch (error) {
      console.error('An error occurred while retrieving top workplaces:', error);
    }
  })();