import { EventEmitter } from "node:events";
import * as services from "../service";

type JobStatus = "running" | "complete" | "error";

interface ReportJob {
  status: JobStatus;
  preview: string;
  error: string | null;
  emitter: EventEmitter;
}

const jobs = new Map<string, ReportJob>();

function createJob(): ReportJob {
  return {
    status: "running",
    preview: "",
    error: null,
    emitter: new EventEmitter(),
  };
}

function scheduleCleanup(visitId: string) {
  setTimeout(() => {
    const job = jobs.get(visitId);
    if (job && job.status !== "running") {
      jobs.delete(visitId);
    }
  }, 5 * 60 * 1000);
}

export function getReportJob(visitId: string) {
  return jobs.get(visitId) ?? null;
}

export function startReportGeneration(visitId: string) {
  const existing = jobs.get(visitId);
  if (existing?.status === "running") {
    return existing;
  }

  const job = createJob();
  jobs.set(visitId, job);

  void (async () => {
    try {
      await services.generateReport(visitId, (chunk) => {
        job.preview += chunk;
        if (job.preview.length > 1200) {
          job.preview = job.preview.slice(-1200);
        }
        job.emitter.emit("progress", chunk, job.preview);
      });

      job.status = "complete";
      job.emitter.emit("complete");
    } catch (error) {
      job.status = "error";
      job.error = error instanceof Error ? error.message : "Stream failed";
      job.emitter.emit("failure", job.error);
    } finally {
      scheduleCleanup(visitId);
    }
  })();

  return job;
}