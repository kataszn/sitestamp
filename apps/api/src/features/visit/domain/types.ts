export interface CreateVisitInput {
  siteName: string;
  inspectorName: string;
  notes?: string;
}

export interface AddEvidenceInput {
  visitId: string;
  image: Express.Multer.File;
  audio?: Express.Multer.File;
  caption?: string;
}