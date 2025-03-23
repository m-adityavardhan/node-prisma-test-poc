import axios from 'axios';

const baseUrl = 'http://localhost:3000';

async function getWorkplaces(): Promise<any>{
    const res = await axios.get(`${baseUrl}/workplaces`);
    return res.data.data;
}

async function getShifts(): Promise<any> {
    let shifts:any = [];
    let nextUrl: string | undefined = `${baseUrl}/shifts`;
  
    while (nextUrl) {
      const response:any = await axios.get<any>(nextUrl);
      const data = response.data;
      shifts = shifts.concat(data.data);
      nextUrl = data.links.next;
    }
    return shifts;
}

async function getWorkers(): Promise<any> {
    let workers:any = [];
    let nextUrl: string | undefined = `${baseUrl}/workers`;
  
    while (nextUrl) {
      const response:any = await axios.get<any>(nextUrl);
      const data = response.data;
      workers = workers.concat(data.data);
      nextUrl = data.links.next;
    }
    return workers;
}

function isCompletedShift(shift: any, activeWorkerIds: Set<number>,activeWorkplacesIds: Set<number>): boolean {
    return (
      shift.workerId !== null &&
      shift.cancelledAt === null &&
      activeWorkerIds.has(shift.workerId) &&
      activeWorkplacesIds.has(shift.workplaceId)
    );
}

async function getTopWorkplaces(): Promise<any>{
    try {
        const workplaces = await getWorkplaces();
        const activeWorkplaces = workplaces.filter((workplace:any) => workplace.status == 0);
        const activeWorkplacesIds = new Set<number>(activeWorkplaces.map((workplace:any) => workplace.id));
        const shifts = await getShifts();

        const workers = await getWorkers();
        const activeWorkers = workers.filter((worker:any) => worker.status === 0);
        const activeWorkerIds = new Set<number>(activeWorkers.map((worker:any) => worker.id));

        const completedShifts = shifts.filter((shift:any) =>
        isCompletedShift(shift, activeWorkerIds,activeWorkplacesIds)
        );
        const workplaceShiftCount: Record<number, number> = {};
        for (const shift of completedShifts) {
        workplaceShiftCount[shift.workplaceId] =
            (workplaceShiftCount[shift.workplaceId] || 0) + 1;
        }
        const workplacesWithCount:any = activeWorkplaces.map((workplace:any) => ({
        ...workplace,
        shifts: workplaceShiftCount[workplace.id] || 0,
        }));

        workplacesWithCount.sort((a:any, b:any) => b.shifts - a.shifts);

        return workplacesWithCount.slice(0, 3);
    } catch (error) {
      console.error('Error fetching top workplaces:', error);
      throw error;
    }
}

(async () => {
    try {
      let topWorkplaces = await getTopWorkplaces();
      topWorkplaces = topWorkplaces.map((ans:any) => ({
        name: ans.name,
        shifts: ans.shifts
      }));
      console.log('Top 3 Active Workplaces by Completed Shifts:', topWorkplaces);
    } catch (error) {
      console.error('An error occurred while retrieving top workplaces:', error);
    }
  })();